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

function checkTool(name: string, command: string, args: string[] = ['--version']): CheckResult {
  try {
    const result = execSync(`${command} ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim();
    return createResult(name, 'pass', result.split('\n')[0]);
  } catch {
    return createResult(
      name,
      'warn',
      '未安装',
      [{ title: `${name} 未安装`, description: `部分功能可能不可用`, severity: 'warn' }]
    );
  }
}

export const toolChecks: CheckDefinition[] = [
  {
    name: 'GitHub CLI (gh)',
    category: 'tools',
    check: () => checkTool('GitHub CLI (gh)', 'gh'),
  },
  {
    name: 'OpenCode CLI',
    category: 'tools',
    check: () => checkTool('OpenCode CLI', 'opencode', ['--version']),
  },
  {
    name: 'Claude CLI',
    category: 'tools',
    check: () => {
      try {
        const hasClaude = existsSync('/home/chen/.local/bin/claude') || existsSync('/usr/local/bin/claude');
        if (hasClaude) {
          return createResult('Claude CLI', 'pass', '已安装');
        }
        return createResult(
          'Claude CLI',
          'warn',
          '未检测到',
          [{ title: 'Claude CLI 未安装', description: '可选工具', severity: 'warn' }]
        );
      } catch {
        return createResult('Claude CLI', 'warn', '检测失败');
      }
    },
  },
  {
    name: 'Cursor CLI',
    category: 'tools',
    check: () => {
      try {
        const hasCursor = existsSync('/usr/local/bin/cursor') || existsSync('/usr/bin/cursor');
        if (hasCursor) {
          return createResult('Cursor CLI', 'pass', '已安装');
        }
        return createResult(
          'Cursor CLI',
          'warn',
          '未检测到',
          [{ title: 'Cursor CLI 未安装', description: '可选工具', severity: 'warn' }]
        );
      } catch {
        return createResult('Cursor CLI', 'warn', '检测失败');
      }
    },
  },
];
