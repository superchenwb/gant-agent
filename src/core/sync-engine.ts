import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './config.js';
import {
  cloneRepo,
  fetchRepo,
  getCurrentCommit,
  resolveRemoteCommit,
} from './git-client.js';
import { detectSkills } from './detector.js';
import { linkSkill, cleanProfileLinks } from './linker.js';
import { readLock, writeLock, createEmptyLock } from './lockfile.js';
import { PATHS, getSourceCachePath, getEditableSourcePath, expandHome } from '../utils/paths.js';
import type { GantConfig, GantLock, LockedSource, Source } from '../models/config.js';

export interface SyncResult {
  sourcesProcessed: number;
  skillsDetected: number;
  profilesLinked: number;
  errors: string[];
}

export async function sync(options: { dryRun?: boolean; verbose?: boolean } = {}): Promise<SyncResult> {
  const result: SyncResult = {
    sourcesProcessed: 0,
    skillsDetected: 0,
    profilesLinked: 0,
    errors: [],
  };

  const config = loadConfig();
  const existingLock = readLock();
  const newLock = createEmptyLock();

  await mkdir(PATHS.cache, { recursive: true });
  await mkdir(PATHS.profiles, { recursive: true });

  for (const [sourceName, source] of Object.entries(config.sources)) {
    try {
      const lockedSource = await processSource(
        sourceName,
        source,
        existingLock?.sources[sourceName],
        config,
        options
      );

      newLock.sources[sourceName] = lockedSource;
      result.sourcesProcessed++;
      result.skillsDetected += lockedSource.skills.length;

      if (options.verbose) {
        console.log(`  ✓ ${sourceName}: ${lockedSource.skills.length} skills`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Source "${sourceName}": ${message}`);
      console.error(`  ✗ ${sourceName}: ${message}`);
    }
  }

  for (const [profileName, sourceNames] of Object.entries(config.profiles)) {
    try {
      await processProfile(
        profileName,
        sourceNames,
        newLock,
        options
      );

      result.profilesLinked++;

      if (options.verbose) {
        console.log(`  ✓ Profile "${profileName}" linked`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Profile "${profileName}": ${message}`);
      console.error(`  ✗ Profile "${profileName}": ${message}`);
    }
  }

  if (!options.dryRun) {
    writeLock(newLock);
  }

  return result;
}

async function processSource(
  sourceName: string,
  source: Source,
  existingLockedSource: LockedSource | undefined,
  _config: GantConfig,
  options: { dryRun?: boolean; verbose?: boolean }
): Promise<LockedSource> {
  if ('localPath' in source) {
    const localPath = expandHome(source.localPath);

    if (!existsSync(localPath)) {
      throw new Error(
        `本地路径不存在: ${localPath}\n建议: 请检查 localPath 配置是否正确，或先创建该目录`
      );
    }

    const isUnchanged = existingLockedSource?.localPath === source.localPath;

    if (isUnchanged && options.verbose) {
      console.log(`  本地源未变化，跳过同步: ${sourceName}`);
    }

    const skills = await detectSkills(localPath, sourceName, undefined, source.exclude);

    return {
      localPath: source.localPath,
      resolvedVersion: 'local',
      resolvedCommit: 'local',
      path: undefined,
      skills,
    };
  }

  if (!('repo' in source)) {
    throw new Error(`无效的 source 类型: ${sourceName}`);
  }

  const resolvedCommit = await resolveRemoteCommit(source.repo, source.version);

  // Editable source: clone to ./.gant-agent/sources/<name>/
  if (source.editable) {
    const editablePath = getEditableSourcePath(sourceName);
    await mkdir(editablePath, { recursive: true });

    const isRepo = existsSync(join(editablePath, '.git'));

    if (options.dryRun) {
      if (!isRepo) {
        throw new Error(`Editable source 不存在（dry-run 模式不克隆）: ${editablePath}`);
      }
      const skills = await detectSkills(editablePath, sourceName, source.path, source.exclude);
      return {
        repo: source.repo,
        resolvedVersion: source.version,
        resolvedCommit,
        path: source.path,
        skills,
        editable: true,
      };
    }

    if (!isRepo) {
      if (options.verbose) {
        console.log(`  克隆 editable source ${sourceName} 到 ${editablePath}...`);
      }
      await cloneRepo({
        repo: source.repo,
        targetPath: editablePath,
        branch: source.version,
        depth: 1,
      });
    } else {
      const currentCommit = await getCurrentCommit(editablePath);
      if (currentCommit !== resolvedCommit) {
        if (options.verbose) {
          console.log(`  更新 editable source ${sourceName} (${currentCommit.slice(0, 8)} -> ${resolvedCommit.slice(0, 8)})...`);
        }
        await fetchRepo(editablePath);
      } else if (options.verbose) {
        console.log(`  跳过 editable source ${sourceName}（版本未变化）`);
      }
    }

    const skills = await detectSkills(editablePath, sourceName, source.path, source.exclude);
    return {
      repo: source.repo,
      resolvedVersion: source.version,
      resolvedCommit,
      path: source.path,
      skills,
      editable: true,
    };
  }

  // Non-editable source: clone to cache (original behavior)
  const cachePath = getSourceCachePath(sourceName, resolvedCommit);

  if (options.dryRun) {
    if (!existsSync(cachePath)) {
      throw new Error(`缓存不存在（dry-run 模式不克隆）: ${cachePath}`);
    }

    const skills = await detectSkills(cachePath, sourceName, source.path, source.exclude);
    return {
      repo: source.repo,
      resolvedVersion: source.version,
      resolvedCommit,
      path: source.path,
      skills,
    };
  }

  const configChanged =
    !existingLockedSource ||
    existingLockedSource.repo !== source.repo ||
    existingLockedSource.resolvedVersion !== source.version ||
    existingLockedSource.path !== source.path;

  const commitChanged =
    configChanged || existingLockedSource?.resolvedCommit !== resolvedCommit;

  if (existsSync(cachePath)) {
    if (commitChanged) {
      if (options.verbose) {
        console.log(`  更新 ${sourceName} (${existingLockedSource?.resolvedCommit?.slice(0, 8) ?? 'none'} -> ${resolvedCommit.slice(0, 8)})...`);
      }

      const currentCommit = await getCurrentCommit(cachePath);

      if (currentCommit !== resolvedCommit) {
        await fetchRepo(cachePath);
      }
    } else {
      if (options.verbose) {
        console.log(`  跳过 ${sourceName}（版本未变化）`);
      }
    }
  } else {
    if (options.verbose) {
      console.log(`  克隆 ${sourceName}...`);
    }

    await cloneRepo({
      repo: source.repo,
      targetPath: cachePath,
      branch: source.version,
      depth: 1,
    });
  }

  const skills = await detectSkills(cachePath, sourceName, source.path, source.exclude);

  return {
    repo: source.repo,
    resolvedVersion: source.version,
    resolvedCommit,
    path: source.path,
    skills,
  };
}

async function processProfile(
  profileName: string,
  sourceNames: string[],
  lock: GantLock,
  options: { dryRun?: boolean; verbose?: boolean }
): Promise<void> {
  if (!options.dryRun) {
    await cleanProfileLinks(profileName);
  }

  const linkedSkills: Array<{ name: string; source: string; targetPath: string }> = [];
  const usedNames = new Set<string>();

  for (const sourceName of sourceNames) {
    const lockedSource = lock.sources[sourceName];
    if (!lockedSource) continue;

    let cachePath: string;
    if (lockedSource.localPath) {
      cachePath = expandHome(lockedSource.localPath);
    } else if (lockedSource.editable) {
      cachePath = getEditableSourcePath(sourceName);
    } else if (lockedSource.repo) {
      cachePath = getSourceCachePath(sourceName, lockedSource.resolvedCommit);
    } else {
      continue;
    }

    for (const skill of lockedSource.skills) {
      let linkName = skill.name;

      if (usedNames.has(linkName)) {
        let counter = 2;
        while (usedNames.has(`${linkName}-${counter}`)) {
          counter++;
        }
        const newName = `${linkName}-${counter}`;
        if (options.verbose) {
          console.log(`  重命名冲突 Skill: ${skill.name} -> ${newName} (来自 ${sourceName})`);
        }
        linkName = newName;
      }

      usedNames.add(linkName);

      if (!options.dryRun) {
        const targetPath = await linkSkill({ ...skill, name: linkName }, cachePath, profileName);
        linkedSkills.push({
          name: linkName,
          source: sourceName,
          targetPath,
        });
      }
    }
  }

  lock.profiles[profileName] = {
    active: false,
    linkedSkills,
  };
}
