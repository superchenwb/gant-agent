import { symlink, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { readLock, writeLock } from '../core/lockfile.js';
import { expandHome, getProfilePath, PATHS, discoverProjectAgents } from '../utils/paths.js';
import { DEFAULT_SETTINGS } from '../models/config.js';

export async function useCommand(profileName: string): Promise<void> {
  try {
    const config = loadConfig();

    if (!config.profiles[profileName]) {
      console.error(chalk.red(`Profile "${profileName}" 不存在`));
      console.error(`可用 Profiles: ${Object.keys(config.profiles).join(', ')}`);
      process.exit(1);
    }

    const lock = readLock();
    if (!lock) {
      console.error(chalk.red('锁定文件不存在，请先运行 gant sync'));
      process.exit(1);
    }

    if (!lock.profiles[profileName]) {
      console.error(chalk.red(`Profile "${profileName}" 尚未同步`));
      console.error('请先运行 gant sync');
      process.exit(1);
    }

    for (const [name, profile] of Object.entries(lock.profiles)) {
      profile.active = name === profileName;
    }

    writeLock(lock);

    const profilePath = getProfilePath(profileName);
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

async function activateProfileForAgent(
  profilePath: string,
  agentPath: string
): Promise<void> {
  if (!existsSync(profilePath)) {
    throw new Error(`Profile 路径不存在: ${profilePath}`);
  }

  const { mkdir } = await import('node:fs/promises');
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
      void 0;
    }
  }
}
