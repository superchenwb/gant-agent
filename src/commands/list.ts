import chalk from 'chalk';
import { readLock } from '../core/lockfile.js';
import { discoverLocalSkills } from '../core/skill-discovery.js';
import { generateAutoProfiles } from '../core/auto-profile.js';

interface ListOptions {
  profile?: string;
  auto?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const lock = readLock();
  const localDiscovery = await discoverLocalSkills();

  if (options.profile) {
    const profile = lock?.profiles[options.profile];
    if (!profile) {
      console.error(chalk.red(`Profile "${options.profile}" 不存在`));
      const available = lock ? Object.keys(lock.profiles) : [];
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

  if (options.auto && lock) {
    const allSkills: Array<{ source: string; skill: { name: string; path: string; source: string } }> = [];
    for (const [sourceName, source] of Object.entries(lock.sources)) {
      for (const skill of source.skills) {
        allSkills.push({ source: sourceName, skill });
      }
    }
    const autoProfiles = generateAutoProfiles(allSkills);

    console.log(chalk.bold('自动检测的 Profiles'));
    console.log('');

    if (autoProfiles.length === 0) {
      console.log(chalk.gray('  暂无自动检测的分类'));
      return;
    }

    for (const profile of autoProfiles) {
      const totalSkills = Array.from(profile.sourceSkills.values()).flat().length;
      const sources = Array.from(profile.sourceSkills.keys()).join(', ');
      console.log(`  ${chalk.cyan(profile.name)} ${chalk.gray(`(${totalSkills} skills from ${sources})`)}`);
      const preview = Array.from(profile.sourceSkills.values()).flat().slice(0, 5);
      for (const skillName of preview) {
        console.log(`    ${chalk.gray('•')} ${skillName}`);
      }
      if (totalSkills > 5) {
        console.log(chalk.gray(`    ... 还有 ${totalSkills - 5} 个`));
      }
      console.log('');
    }

    console.log(`共 ${autoProfiles.length} 个自动检测的 Profiles`);
    return;
  }

  if (lock) {
    console.log(chalk.bold('已同步 Skills'));
    console.log('');

    let totalSkills = 0;

    for (const [sourceName, source] of Object.entries(lock.sources)) {
      console.log(`${chalk.bold(sourceName)} ${chalk.gray(`(${source.resolvedVersion})`)}`);

      if (source.skills.length === 0) {
        console.log(chalk.gray('  暂无 Skills'));
      } else {
      for (const skill of source.skills) {
        const extras: string[] = [];
        if (skill.description) extras.push(skill.description);
        if (skill.triggers) extras.push(`triggers: [${skill.triggers.join(', ')}]`);
        if (skill.tools) extras.push(`tools: [${skill.tools.join(', ')}]`);
        const extraStr = extras.length > 0 ? chalk.gray(` — ${extras.join(', ')}`) : '';
        console.log(`  ${chalk.cyan(skill.name)} ${chalk.gray(skill.path)}${extraStr}`);
      }
      }

      totalSkills += source.skills.length;
      console.log('');
    }

    console.log(`共 ${Object.keys(lock.sources).length} 个知识源，${totalSkills} 个 Skills`);
    console.log('');
  }

  if (localDiscovery.skills.length > 0) {
    console.log(chalk.bold('本地发现 Skills'));
    console.log('');

    for (const scope of localDiscovery.scopes) {
      if (scope.skills.length === 0) continue;
      console.log(`${chalk.bold(scope.scope)} ${chalk.gray(scope.path)}`);
      for (const skill of scope.skills) {
        console.log(`  ${chalk.cyan(skill.name)}`);
      }
      console.log('');
    }

    if (localDiscovery.conflicts.length > 0) {
      console.log(chalk.yellow('冲突（高优先级覆盖低优先级）：'));
      for (const conflict of localDiscovery.conflicts) {
        console.log(`  ${chalk.yellow('!')} ${chalk.cyan(conflict.name)}: ${conflict.winner} > ${conflict.losers.join(', ')}`);
      }
      console.log('');
    }

    console.log(`共 ${localDiscovery.skills.length} 个本地 Skills`);
  } else if (!lock) {
    console.log(chalk.gray('暂无 Skills。请运行 gant sync 同步知识库，或在 .gant/skills/ 目录放置本地 Skills。'));
  }
}
