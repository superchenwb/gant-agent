import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { PATHS, getConfigSource, isProjectMode, discoverProjectAgents } from '../utils/paths.js';

export async function doctorCommand(): Promise<void> {
  let hasError = false;

  console.log(chalk.bold('Gant-Agent 环境诊断'));
  console.log('');

  const source = getConfigSource();
  console.log(`  配置模式: ${isProjectMode() ? chalk.cyan(source) : chalk.gray(source)}`);

  const projectAgents = discoverProjectAgents();
  const agentNames = Object.keys(projectAgents);
  if (agentNames.length > 0) {
    console.log(`  项目级 Agent: ${chalk.green(agentNames.join(', '))}`);
  } else {
    console.log(`  项目级 Agent: ${chalk.gray('未检测到')}`);
  }

  interface Check {
    name: string;
    check: () => unknown;
    validate: (v: unknown) => boolean;
    message: (v: unknown) => string;
  }

  const checks: Check[] = [
    {
      name: 'Node.js',
      check: () => process.version,
      validate: (v) => {
        const major = parseInt((v as string).slice(1).split('.')[0], 10);
        return major >= 18;
      },
      message: (v) => `${v} (需要 >= 18)`,
    },
    {
      name: 'Git',
      check: () => {
        try {
          return execSync('git --version', { encoding: 'utf-8' }).trim();
        } catch {
          return null;
        }
      },
      validate: (v) => v !== null,
      message: (v) => (v as string | null) || '未安装',
    },
    {
      name: '配置目录',
      check: () => PATHS.home,
      validate: () => true,
      message: (v) => String(v),
    },
    {
      name: '配置文件',
      check: () => existsSync(PATHS.config),
      validate: (v) => Boolean(v),
      message: (v) =>
        v ? PATHS.config : '未创建（运行 gant init）',
    },
  ];

  for (const check of checks) {
    const value = check.check();
    const pass = check.validate(value);
    const icon = pass ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${icon} ${check.name}: ${check.message(value)}`);
    if (!pass) hasError = true;
  }

  console.log('');

  if (hasError) {
    console.log(chalk.red('发现环境问题，请修复后重试'));
    process.exit(1);
  } else {
    console.log(chalk.green('环境检查通过'));
  }
}
