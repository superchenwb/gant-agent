import { CheckDefinition, CheckResult, CheckStatus } from '../types.js';

function createResult(
  name: string,
  status: CheckStatus,
  message: string,
  issues: CheckResult['issues'] = []
): CheckResult {
  return { name, status, message, issues, duration: 0 };
}

export const configChecks: CheckDefinition[] = [
  {
    name: '配置格式',
    category: 'config',
    check: async () => {
      try {
        const { loadConfig } = await import('../../../core/config.js');
        loadConfig();
        return createResult('配置格式', 'pass', '格式正确');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return createResult(
          '配置格式',
          'fail',
          msg,
          [{ title: '配置错误', description: msg, severity: 'error' }]
        );
      }
    },
  },
  {
    name: '知识源配置',
    category: 'config',
    check: async () => {
      try {
        const { loadConfig } = await import('../../../core/config.js');
        const config = loadConfig();
        const sourceCount = Object.keys(config.sources).length;
        if (sourceCount === 0) {
          return createResult(
            '知识源配置',
            'warn',
            '未配置知识源',
            [{ title: '无知识源', description: '运行 gant init 添加知识源', severity: 'warn' }]
          );
        }
        return createResult('知识源配置', 'pass', `${sourceCount} 个知识源`);
      } catch (error) {
        return createResult('知识源配置', 'fail', '无法读取配置');
      }
    },
  },
  {
    name: 'Profiles 配置',
    category: 'config',
    check: async () => {
      try {
        const { loadConfig } = await import('../../../core/config.js');
        const config = loadConfig();
        const profileCount = Object.keys(config.profiles).length;
        if (profileCount === 0) {
          return createResult(
            'Profiles 配置',
            'warn',
            '未配置 Profiles',
            [{ title: '无 Profiles', description: '配置文件中缺少 profiles 定义', severity: 'warn' }]
          );
        }
        return createResult('Profiles 配置', 'pass', `${profileCount} 个 profiles`);
      } catch (error) {
        return createResult('Profiles 配置', 'fail', '无法读取配置');
      }
    },
  },
];
