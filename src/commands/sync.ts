import chalk from 'chalk';
import ora from 'ora';
import { sync } from '../core/sync-engine.js';
import { generateAutoProfiles } from '../core/auto-profile.js';
import { readLock } from '../core/lockfile.js';

interface SyncOptions {
  dryRun?: boolean;
  verbose?: boolean;
  auto?: boolean;
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

    if (options.auto) {
      await showAutoProfiles();
    }

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

async function showAutoProfiles(): Promise<void> {
  const lock = readLock();
  if (!lock) return;

  const allSkills: Array<{ source: string; skill: { name: string; path: string; source: string; description?: string; triggers?: string[]; tools?: string[] } }> = [];

  for (const [sourceName, source] of Object.entries(lock.sources)) {
    for (const skill of source.skills) {
      allSkills.push({ source: sourceName, skill });
    }
  }

  const autoProfiles = generateAutoProfiles(allSkills);

  if (autoProfiles.length > 0) {
    console.log('');
    console.log(chalk.cyan('  自动检测到的 Profiles:'));
    for (const profile of autoProfiles.slice(0, 10)) {
      const totalSkills = Array.from(profile.sourceSkills.values()).flat().length;
      console.log(`    ${chalk.bold(profile.name)} ${chalk.gray(`(${totalSkills} skills)`)}`);
    }
    console.log(chalk.gray('  提示: 使用 gant use <profile> 激活'));
  }
}
