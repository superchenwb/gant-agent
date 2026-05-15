import { unlink, rmdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { readLock, writeLock } from '../core/lockfile.js';
import { getProfilePath, expandHome, discoverProjectAgents } from '../utils/paths.js';
import { DEFAULT_SETTINGS } from '../models/config.js';

export async function removeCommand(profileName: string): Promise<void> {
  try {
    const lock = readLock();

    if (!lock) {
      console.error(chalk.red('锁定文件不存在，无需删除'));
      process.exit(1);
    }

    const profilePath = getProfilePath(profileName);

    if (!existsSync(profilePath)) {
      console.error(chalk.red(`Profile "${profileName}" 不存在`));
      process.exit(1);
    }

    const projectAgents = discoverProjectAgents();
    const globalAgents = DEFAULT_SETTINGS.agentPaths;
    let cleanedAgents = 0;

    for (const [agentName, globalPathRaw] of Object.entries(globalAgents)) {
      try {
        const globalPath = expandHome(globalPathRaw);
        const isProjectLevel = agentName in projectAgents;
        const agentPath = isProjectLevel ? projectAgents[agentName] : globalPath;

        if (!existsSync(agentPath)) continue;

        const entries = await readdir(agentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isSymbolicLink()) continue;

          const linkPath = join(agentPath, entry.name);
          try {
            const { readlink } = await import('node:fs/promises');
            const linkTarget = await readlink(linkPath);
            if (linkTarget.includes(profilePath)) {
              await unlink(linkPath);
            }
          } catch {
            void 0;
          }
        }

        cleanedAgents++;
      } catch {
        void 0;
      }
    }

    const entries = await readdir(profilePath, { withFileTypes: true });
    let cleanedLinks = 0;
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        await unlink(join(profilePath, entry.name));
        cleanedLinks++;
      }
    }

    try {
      await rmdir(profilePath);
    } catch {
      void 0;
    }

    if (lock.profiles[profileName]) {
      delete lock.profiles[profileName];
      writeLock(lock);
    }

    console.log(chalk.green(`✓ 已删除 Profile: ${profileName}`));
    if (cleanedLinks > 0) {
      console.log(`  清理了 ${cleanedLinks} 个 skills 链接`);
    }
    if (cleanedAgents > 0) {
      console.log(`  清理了 ${cleanedAgents} 个 Agent 目录的链接`);
    }
  } catch (error) {
    console.error(chalk.red('删除失败:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
