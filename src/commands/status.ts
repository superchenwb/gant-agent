import { existsSync } from 'node:fs';
import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { PATHS, getConfigSource, isProjectMode, discoverProjectAgents } from '../utils/paths.js';

export async function statusCommand(): Promise<void> {
  console.log(chalk.bold('Gant-Agent 状态'));
  console.log('');

  const source = getConfigSource();
  console.log(`配置模式: ${isProjectMode() ? chalk.cyan(source) : chalk.gray(source)}`);
  console.log(`配置目录: ${PATHS.home}`);
  console.log(`配置文件: ${existsSync(PATHS.config) ? chalk.green('✓ 存在') : chalk.red('✗ 不存在')}`);
  console.log(`锁定文件: ${existsSync(PATHS.lock) ? chalk.green('✓ 存在') : chalk.red('✗ 不存在')}`);

  const projectAgents = discoverProjectAgents();
  const agentNames = Object.keys(projectAgents);
  if (agentNames.length > 0) {
    console.log(`项目级 Agent: ${chalk.green(agentNames.join(', '))}`);
  }

  console.log('');

  if (!existsSync(PATHS.config)) {
    console.log(chalk.yellow('尚未初始化，请运行: gant init'));
    return;
  }

  try {
    const config = loadConfig();

    console.log(chalk.bold('知识源:'));
    for (const [name, source] of Object.entries(config.sources)) {
      if ('repo' in source) {
        console.log(`  ${chalk.cyan(name)}: ${source.repo}@${source.version}`);
      } else {
        console.log(`  ${chalk.cyan(name)}: ${source.localPath} ${chalk.gray('(本地)')}`);
      }
    }

    console.log('');
    console.log(chalk.bold('Profiles:'));
    for (const [name, sources] of Object.entries(config.profiles)) {
      console.log(`  ${chalk.cyan(name)}: ${sources.join(', ')}`);
    }
  } catch (error) {
    console.error(chalk.red(`读取配置失败: ${error instanceof Error ? error.message : String(error)}`));
  }
}
