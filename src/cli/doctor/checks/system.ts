import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { CheckDefinition, CheckResult, CheckStatus } from '../types.js';

function createResult(
  name: string,
  status: CheckStatus,
  message: string,
  issues: CheckResult['issues'] = []
): CheckResult {
  return { name, status, message, issues, duration: 0 };
}

export const systemChecks: CheckDefinition[] = [
  {
    name: 'Node.js / Bun 版本',
    category: 'system',
    check: () => {
      try {
        const nodeVersion = process.version;
        const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
        if (major >= 20) {
          return createResult('Node.js / Bun 版本', 'pass', `${nodeVersion} (>= 20)`);
        }
        return createResult(
          'Node.js / Bun 版本',
          'fail',
          `${nodeVersion} (需要 >= 20)`,
          [{ title: '版本过低', description: `当前 ${nodeVersion}，需要 Node.js >= 20 或 Bun >= 1.0`, severity: 'error' }]
        );
      } catch (error) {
        return createResult('Node.js / Bun 版本', 'fail', '无法检测版本');
      }
    },
  },
  {
    name: 'Git',
    category: 'system',
    check: () => {
      try {
        const version = execSync('git --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
        return createResult('Git', 'pass', version);
      } catch {
        return createResult(
          'Git',
          'fail',
          '未安装',
          [{ title: 'Git 未安装', description: 'gant-agent 依赖 Git 来同步知识源', severity: 'error' }]
        );
      }
    },
  },
  {
    name: '配置目录',
    category: 'system',
    check: async () => {
      const { PATHS, isProjectMode } = await import('../../../utils/paths.js');
      const mode = isProjectMode() ? '项目级' : '用户级';
      return createResult('配置目录', 'pass', `${mode}: ${PATHS.home}`);
    },
  },
  {
    name: '配置文件',
    category: 'system',
    check: async () => {
      const { PATHS } = await import('../../../utils/paths.js');
      if (existsSync(PATHS.config)) {
        return createResult('配置文件', 'pass', PATHS.config);
      }
      return createResult(
        '配置文件',
        'fail',
        '未创建',
        [{ title: '配置缺失', description: '运行 gant init 初始化配置', severity: 'error' }]
      );
    },
  },
  {
    name: '锁定文件',
    category: 'system',
    check: async () => {
      const { PATHS } = await import('../../../utils/paths.js');
      if (existsSync(PATHS.lock)) {
        return createResult('锁定文件', 'pass', PATHS.lock);
      }
      return createResult(
        '锁定文件',
        'warn',
        '不存在',
        [{ title: '未同步', description: '运行 gant sync 生成锁定文件', severity: 'warn' }]
      );
    },
  },
];
