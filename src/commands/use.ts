import { symlink, unlink, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { readLock, writeLock } from '../core/lockfile.js';
import { generateAutoProfiles } from '../core/auto-profile.js';
import { expandHome, getProfilePath, PATHS, discoverProjectAgents } from '../utils/paths.js';
import { DEFAULT_SETTINGS } from '../models/config.js';

export async function useCommand(profileName: string): Promise<void> {
  try {
    const config = loadConfig();
    const lock = readLock();

    if (!lock) {
      console.error(chalk.red('锁定文件不存在，请先运行 gant sync'));
      process.exit(1);
    }

    const profilePath = getProfilePath(profileName);
    const autoProfile = findAutoProfile(lock, profileName);

    if (!config.profiles[profileName] && !autoProfile) {
      const available = listAvailableProfiles(config, lock);
      console.error(chalk.red(`Profile "${profileName}" 不存在`));
      console.error(`可用 Profiles: ${available.join(', ')}`);
      process.exit(1);
    }

    const isManualProfile = config.profiles[profileName];
    const isAutoProfile = !!autoProfile;

    if (isManualProfile && isAutoProfile) {
      console.warn(chalk.yellow(`Profile "${profileName}" 同时存在手动配置和自动检测的分类。`));
      console.warn(chalk.yellow('将使用自动检测的分类（更精确）。如需使用手动配置，请重命名。'));
    }

    if (isAutoProfile) {
      await createAutoProfileLinks(autoProfile, profilePath);
    } else if (isManualProfile && !lock.profiles[profileName]) {
      console.error(chalk.red(`Profile "${profileName}" 尚未同步`));
      console.error('请先运行 gant sync');
      process.exit(1);
    }

    for (const [name, profile] of Object.entries(lock.profiles)) {
      profile.active = name === profileName;
    }

    writeLock(lock);

    const projectAgents = discoverProjectAgents();
    const globalAgents = config.settings?.agentPaths || DEFAULT_SETTINGS.agentPaths;
    const linkedAgents: string[] = [];
    const failedAgents: string[] = [];

    for (const [agentName, globalPathRaw] of Object.entries(globalAgents)) {
      try {
        const globalPath = expandHome(globalPathRaw);
        const isProjectLevel = agentName in projectAgents;
        const agentPath = isProjectLevel ? projectAgents[agentName] : globalPath;

        if (isProjectLevel) {
          await cleanOldAgentLinks(globalPath);
        }

        await activateProfileForAgent(profilePath, agentPath);

        const label = isProjectLevel ? `${agentName}(项目)` : `${agentName}(全局)`;
        linkedAgents.push(label);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(chalk.yellow(`  ⚠ ${agentName}: ${msg}`));
        failedAgents.push(agentName);
      }
    }

    console.log(chalk.green(`✓ 已切换到 Profile: ${profileName}`));
    console.log(`  Skills 路径: ${profilePath}`);

    if (linkedAgents.length > 0) {
      console.log(`  已同步到 Agent: ${chalk.cyan(linkedAgents.join(', '))}`);
    }

    if (failedAgents.length > 0) {
      console.log(`  同步失败: ${chalk.red(failedAgents.join(', '))}`);
    }
  } catch (error) {
    console.error(chalk.red(`错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

function findAutoProfile(lock: ReturnType<typeof readLock>, name: string) {
  if (!lock) return null;

  const allSkills: Array<{ source: string; skill: { name: string; path: string; source: string; description?: string; triggers?: string[]; tools?: string[] } }> = [];
  for (const [sourceName, source] of Object.entries(lock.sources)) {
    for (const skill of source.skills) {
      allSkills.push({ source: sourceName, skill });
    }
  }

  const autoProfiles = generateAutoProfiles(allSkills);
  return autoProfiles.find(p => p.name === name) || null;
}

function listAvailableProfiles(config: ReturnType<typeof loadConfig>, lock: ReturnType<typeof readLock>): string[] {
  const manual = Object.keys(config.profiles);

  const auto: string[] = [];
  if (lock) {
    const allSkills: Array<{ source: string; skill: { name: string; path: string; source: string } }> = [];
    for (const [sourceName, source] of Object.entries(lock.sources)) {
      for (const skill of source.skills) {
        allSkills.push({ source: sourceName, skill });
      }
    }
    const autoProfiles = generateAutoProfiles(allSkills);
    auto.push(...autoProfiles.map(p => p.name));
  }

  return Array.from(new Set([...manual, ...auto]));
}

async function createAutoProfileLinks(
  autoProfile: ReturnType<typeof findAutoProfile>,
  profilePath: string
): Promise<void> {
  if (!autoProfile) return;

  const lock = readLock();
  if (!lock) return;

  await mkdir(profilePath, { recursive: true });

  const existing = await readdir(profilePath);
  for (const entry of existing) {
    try { await unlink(join(profilePath, entry)); } catch { void 0; }
  }

  for (const [sourceName, skillNames] of autoProfile.sourceSkills) {
    const lockedSource = lock.sources[sourceName];
    if (!lockedSource) continue;

    const sourceBasePath = lockedSource.localPath
      ? expandHome(lockedSource.localPath)
      : join(PATHS.cache, `${sourceName}@${lockedSource.resolvedCommit?.slice(0, 8) || 'unknown'}`);

    for (const skillName of skillNames) {
      const skill = lockedSource.skills.find(s => s.name === skillName);
      if (!skill) continue;

      const skillSourcePath = join(sourceBasePath, skill.path);
      const targetLink = join(profilePath, skillName);

      if (existsSync(skillSourcePath)) {
        try {
          if (existsSync(targetLink)) await unlink(targetLink);
          await symlink(skillSourcePath, targetLink);
        } catch {
          return;
        }
      }
    }
  }
}

async function activateProfileForAgent(
  profilePath: string,
  agentPath: string
): Promise<void> {
  if (!existsSync(profilePath)) {
    throw new Error(`Profile 路径不存在: ${profilePath}`);
  }

  await mkdir(agentPath, { recursive: true });
  await cleanOldAgentLinks(agentPath);

  const entries = await readdir(profilePath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isSymbolicLink()) continue;

    const skillName = entry.name;
    const sourceLink = join(profilePath, skillName);
    const targetLink = join(agentPath, skillName);

    if (existsSync(targetLink)) {
      const { lstat } = await import('node:fs/promises');
      const stats = await lstat(targetLink);
      if (stats.isSymbolicLink()) {
        await unlink(targetLink);
      }
    }

    await symlink(sourceLink, targetLink);
  }
}

async function cleanOldAgentLinks(agentPath: string): Promise<void> {
  if (!existsSync(agentPath)) return;

  const entries = await readdir(agentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isSymbolicLink()) continue;

    const linkPath = join(agentPath, entry.name);
    const { readlink } = await import('node:fs/promises');

    try {
      const linkTarget = await readlink(linkPath);
      if (linkTarget.includes(PATHS.profiles)) {
        await unlink(linkPath);
      }
    } catch {
      return;
    }
  }
}
