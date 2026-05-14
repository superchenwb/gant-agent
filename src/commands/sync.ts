import chalk from 'chalk';
import ora from 'ora';
import { sync } from '../core/sync-engine.js';

interface SyncOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  try {
    if (options.verbose) {
      console.log(chalk.blue('开始同步...\n'));
    }

    const spinner = options.verbose ? null : ora('同步中...').start();
    const result = await sync(options);

    spinner?.stop();

    console.log('');
    console.log(chalk.green('同步完成'));
    console.log(`  知识源: ${result.sourcesProcessed}`);
    console.log(`  Skills: ${result.skillsDetected}`);
    console.log(`  Profiles: ${result.profilesLinked}`);

    if (result.errors.length > 0) {
      console.log('');
      console.error(chalk.red(`  错误: ${result.errors.length}`));
      for (const error of result.errors) {
        console.error(chalk.red(`    - ${error}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`同步失败: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
