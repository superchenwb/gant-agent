import { symlink, unlink, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { readLock, writeLock } from '../core/lockfile.js';
import { generateAutoProfiles } from '../core/auto-profile.js';
import { expandHome, getProfilePath, PATHS, discoverProjectAgents } from '../utils/paths.js';
import { DEFAULT_SETTINGS } from '../models/config.js';

export async function useCommand(profileNames: string): Promise<void> {
  try {
    const names = profileNames.split(',').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) {
      console.error(chalk.red('请指定至少一个 Profile'));
      process.exit(1);
    }

    const config = loadConfig();
    const lock = readLock();

    if (!lock) {
      console.error(chalk.red('锁定文件不存在，请先运行 gant sync'));
      process.exit(1);
    }

    const combinedName = names.join('+');
    const profilePath = getProfilePath(combinedName);

    const allSkills: Array<{ source: string; skill: { name: string; path: string; source: string; description?: string; triggers?: string[]; tools?: string[]; tags?: string[] } }> = [];
    for (const [sourceName, source] of Object.entries(lock.sources)) {
      for (const skill of source.skills) {
        allSkills.push({ source: sourceName, skill });
      }
    }
    const autoProfiles = generateAutoProfiles(allSkills);

    const notFound: string[] = [];
    const resolvedProfiles: Array<{ name: string; isAuto: boolean; autoProfile?: ReturnType<typeof findAutoProfile> }> = [];

    for (const name of names) {
      const autoProfile = autoProfiles.find(p => p.name === name) || null;
      const isManual = !!config.profiles[name];

      if (!isManual && !autoProfile) {
        notFound.push(name);
        continue;
      }

      resolvedProfiles.push({ name, isAuto: !!autoProfile, autoProfile: autoProfile || undefined });
    }

    if (notFound.length > 0) {
      const available = Array.from(new Set([...Object.keys(config.profiles), ...autoProfiles.map(p => p.name)]));
      console.error(chalk.red(`以下 Profile 不存在: ${notFound.join(', ')}`));
      console.error(`可用 Profiles: ${available.join(', ')}`);
      process.exit(1);
    }

    await mkdir(profilePath, { recursive: true });

    const existing = await readdir(profilePath);
    for (const entry of existing) {
      try { await unlink(join(profilePath, entry)); } catch { void 0; }
    }

    let totalSkills = 0;
    const seenSkills = new Set<string>();

    for (const rp of resolvedProfiles) {
      if (rp.isAuto && rp.autoProfile) {
        for (const [sourceName, skillNames] of rp.autoProfile.sourceSkills) {
          const lockedSource = lock.sources[sourceName];
          if (!lockedSource) continue;

          const sourceBasePath = lockedSource.localPath
            ? expandHome(lockedSource.localPath)
            : join(PATHS.cache, `${sourceName}@${lockedSource.resolvedCommit?.slice(0, 8) || 'unknown'}`);

          for (const skillName of skillNames) {
            if (seenSkills.has(skillName)) continue;
            seenSkills.add(skillName);

            const skill = lockedSource.skills.find(s => s.name === skillName);
            if (!skill) continue;

            const skillSourcePath = join(sourceBasePath, skill.path);
            const targetLink = join(profilePath, skillName);

            if (existsSync(skillSourcePath)) {
              try {
                if (existsSync(targetLink)) await unlink(targetLink);
                await symlink(skillSourcePath, targetLink);
                totalSkills++;
              } catch {
                void 0;
              }
            }
          }
        }
      } else if (config.profiles[rp.name]) {
        const manualProfile = lock.profiles[rp.name];
        if (manualProfile) {
          for (const linkedSkill of manualProfile.linkedSkills) {
            if (seenSkills.has(linkedSkill.name)) continue;
            seenSkills.add(linkedSkill.name);

            const sourcePath = getProfilePath(rp.name);
            const sourceLink = join(sourcePath, linkedSkill.name);
            const targetLink = join(profilePath, linkedSkill.name);

            if (existsSync(sourceLink)) {
              try {
                if (existsSync(targetLink)) await unlink(targetLink);
                await symlink(sourceLink, targetLink);
                totalSkills++;
              } catch {
                void 0;
              }
            }
          }
        }
      }
    }

    for (const [name, profile] of Object.entries(lock.profiles)) {
      profile.active = name === combinedName;
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

    if (names.length === 1) {
      console.log(chalk.green(`✓ 已切换到 Profile: ${names[0]}`));
    } else {
      console.log(chalk.green(`✓ 已组合 ${names.length} 个 Profiles: ${combinedName}`));
      console.log(`  包含 ${totalSkills} 个 skills（去重后）`);
    }
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

  const allSkills: Array<{ source: string; skill: { name: string; path: string; source: string; description?: string; triggers?: string[]; tools?: string[]; tags?: string[] } }> = [];
  for (const [sourceName, source] of Object.entries(lock.sources)) {
    for (const skill of source.skills) {
      allSkills.push({ source: sourceName, skill });
    }
  }

  const autoProfiles = generateAutoProfiles(allSkills);
  return autoProfiles.find(p => p.name === name) || null;
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
