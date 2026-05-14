import chalk from 'chalk';
import { readLock } from '../core/lockfile.js';

interface ListOptions {
  profile?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const lock = readLock();

  if (!lock) {
    console.error(chalk.red('锁定文件不存在，请先运行 gant sync'));
    process.exit(1);
  }

  if (options.profile) {
    const profile = lock.profiles[options.profile];
    if (!profile) {
      console.error(chalk.red(`Profile "${options.profile}" 不存在`));
      const available = Object.keys(lock.profiles);
      if (available.length > 0) {
        console.error(`可用 Profiles: ${available.join(', ')}`);
      }
      process.exit(1);
    }

    console.log(chalk.bold(`Profile: ${options.profile}`));
    console.log('');

    if (profile.linkedSkills.length === 0) {
      console.log(chalk.gray('  暂无 Skills'));
      return;
    }

    for (const skill of profile.linkedSkills) {
      const activeMark = profile.active ? chalk.green('● ') : '  ';
      console.log(`${activeMark}${chalk.cyan(skill.name)} ${chalk.gray(`(${skill.source})`)}`);
    }

    console.log('');
    console.log(`共 ${profile.linkedSkills.length} 个 Skills`);
    return;
  }

  console.log(chalk.bold('所有 Skills'));
  console.log('');

  let totalSkills = 0;

  for (const [sourceName, source] of Object.entries(lock.sources)) {
    console.log(`${chalk.bold(sourceName)} ${chalk.gray(`(${source.resolvedVersion})`)}`);

    if (source.skills.length === 0) {
      console.log(chalk.gray('  暂无 Skills'));
    } else {
      for (const skill of source.skills) {
        console.log(`  ${chalk.cyan(skill.name)} ${chalk.gray(skill.path)}`);
      }
    }

    totalSkills += source.skills.length;
    console.log('');
  }

  console.log(`共 ${Object.keys(lock.sources).length} 个知识源，${totalSkills} 个 Skills`);
}
