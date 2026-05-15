import chalk from 'chalk';
import { DoctorResult, CheckResult } from './types.js';
import { getAllCheckDefinitions } from './checks/index.js';

function getStatusIcon(status: CheckResult['status']): string {
  switch (status) {
    case 'pass': return chalk.green('✓');
    case 'warn': return chalk.yellow('⚠');
    case 'fail': return chalk.red('✗');
    case 'skip': return chalk.gray('○');
    default: return '?';
  }
}

function getStatusLabel(status: CheckResult['status']): string {
  switch (status) {
    case 'pass': return chalk.green('通过');
    case 'warn': return chalk.yellow('警告');
    case 'fail': return chalk.red('失败');
    case 'skip': return chalk.gray('跳过');
    default: return '未知';
  }
}

export function formatDefaultOutput(result: DoctorResult): string {
  const lines: string[] = [];
  lines.push(chalk.bold('\nGant-Agent 环境诊断'));
  lines.push('');

  const categories = ['system', 'config', 'tools', 'skills'] as const;
  const categoryNames: Record<string, string> = {
    system: '系统',
    config: '配置',
    tools: '工具',
    skills: 'Skills',
  };

  for (const category of categories) {
    const checks = result.results.filter((r) => {
      const checkDef = getAllCheckDefinitions().find((c) => c.name === r.name);
      return checkDef?.category === category;
    });
    if (checks.length === 0) continue;

    lines.push(chalk.bold(`  ${categoryNames[category]}`));
    for (const check of checks) {
      const icon = getStatusIcon(check.status);
      lines.push(`    ${icon} ${check.name}: ${check.message}`);
      if (check.issues.length > 0) {
        for (const issue of check.issues) {
          const severityColor = issue.severity === 'error' ? chalk.red : chalk.yellow;
          lines.push(`       ${severityColor('→')} ${issue.title}: ${issue.description}`);
        }
      }
    }
    lines.push('');
  }

  const { summary } = result;
  const totalColor = summary.failed > 0 ? chalk.red : summary.warnings > 0 ? chalk.yellow : chalk.green;
  lines.push(`  ${totalColor(`${summary.passed}/${summary.total} 通过`)} ${summary.warnings > 0 ? chalk.yellow(`(${summary.warnings} 警告)`) : ''} ${summary.failed > 0 ? chalk.red(`(${summary.failed} 失败)`) : ''}`);
  lines.push(`  耗时: ${summary.duration}ms`);
  lines.push('');

  return lines.join('\n');
}

export function formatStatusOutput(result: DoctorResult): string {
  const { summary } = result;
  if (summary.failed > 0) {
    return chalk.red(`✗ ${summary.failed} 失败, ${summary.warnings} 警告`);
  }
  if (summary.warnings > 0) {
    return chalk.yellow(`⚠ ${summary.warnings} 警告`);
  }
  return chalk.green(`✓ ${summary.passed}/${summary.total}`);
}

export function formatVerboseOutput(result: DoctorResult): string {
  const lines: string[] = [];
  lines.push(formatDefaultOutput(result));

  lines.push(chalk.bold('  详细结果:'));
  for (const check of result.results) {
    lines.push(`    ${check.name}:`);
    lines.push(`      状态: ${getStatusLabel(check.status)}`);
    lines.push(`      消息: ${check.message}`);
    lines.push(`      耗时: ${check.duration}ms`);
    if (check.issues.length > 0) {
      lines.push(`      问题:`);
      for (const issue of check.issues) {
        lines.push(`        - [${issue.severity}] ${issue.title}: ${issue.description}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatJsonOutput(result: DoctorResult): string {
  return JSON.stringify(result, null, 2);
}
