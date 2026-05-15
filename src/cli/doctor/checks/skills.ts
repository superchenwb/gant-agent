import { CheckDefinition, CheckResult, CheckStatus } from '../types.js';

function createResult(
  name: string,
  status: CheckStatus,
  message: string,
  issues: CheckResult['issues'] = []
): CheckResult {
  return { name, status, message, issues, duration: 0 };
}

export const skillChecks: CheckDefinition[] = [
  {
    name: 'Skill 仓库同步状态',
    category: 'skills',
    check: async () => {
      try {
        const { readLock } = await import('../../../core/lockfile.js');
        const lock = readLock();
        if (!lock) {
          return createResult(
            'Skill 仓库同步状态',
            'warn',
            '未同步',
            [{ title: '无锁定文件', description: '运行 gant sync 同步知识源', severity: 'warn' }]
          );
        }
        const sourceCount = Object.keys(lock.sources).length;
        const totalSkills = Object.values(lock.sources).reduce((sum, s) => sum + s.skills.length, 0);
        return createResult('Skill 仓库同步状态', 'pass', `${sourceCount} 个源, ${totalSkills} 个 skills`);
      } catch (error) {
        return createResult('Skill 仓库同步状态', 'fail', '无法读取锁定文件');
      }
    },
  },
  {
    name: 'Profile 链接状态',
    category: 'skills',
    check: async () => {
      try {
        const { readLock } = await import('../../../core/lockfile.js');
        const lock = readLock();
        if (!lock) {
          return createResult('Profile 链接状态', 'skip', '无锁定文件');
        }
        const activeProfiles = Object.entries(lock.profiles).filter(([, p]) => p.active);
        if (activeProfiles.length === 0) {
          return createResult(
            'Profile 链接状态',
            'warn',
            '未激活 Profile',
            [{ title: '未激活', description: '运行 gant use <profile> 激活', severity: 'warn' }]
          );
        }
        const [name, profile] = activeProfiles[0];
        return createResult('Profile 链接状态', 'pass', `${name}: ${profile.linkedSkills.length} 个 skills`);
      } catch (error) {
        return createResult('Profile 链接状态', 'fail', '检查失败');
      }
    },
  },
];
