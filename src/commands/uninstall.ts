import { unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { PATHS, expandHome, discoverProjectAgents } from '../utils/paths.js';
import { DEFAULT_SETTINGS } from '../models/config.js';

export async function uninstallCommand(): Promise<void> {
  console.log(chalk.yellow('即将卸载 Gant-Agent，这会删除所有配置、缓存和符号链接。'));
  console.log('');

  const projectAgents = discoverProjectAgents();
  const globalAgents = DEFAULT_SETTINGS.agentPaths;
  let cleanedAgents = 0;
  let cleanedLinks = 0;

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
          if (linkTarget.includes(PATHS.profiles)) {
            await unlink(linkPath);
            cleanedLinks++;
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

  const home = PATHS.home;

  if (existsSync(home)) {
    console.log(chalk.gray(`删除配置目录: ${home}`));
    try {
      const { rm } = await import('node:fs/promises');
      await rm(home, { recursive: true, force: true });
    } catch {
      void 0;
    }
  }

  console.log('');
  console.log(chalk.green('✓ 卸载完成'));
  console.log(`  清理了 ${cleanedLinks} 个 Agent 符号链接`);
  console.log(`  清理了 ${cleanedAgents} 个 Agent 目录`);
  console.log(`  删除了配置目录: ${home}`);
  console.log('');
  console.log('如需完全移除 gant-agent，请手动运行:');
  console.log(chalk.cyan('  npm uninstall -g gant-agent'));
}
