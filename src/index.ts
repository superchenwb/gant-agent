#!/usr/bin/env node

import { Command } from 'commander';
import { checkForUpdatesBackground } from './utils/version-check.js';

const VERSION = '0.2.1';
const program = new Command();

program
  .name('gant')
  .description('团队级 AI 业务知识库管理工具')
  .version(VERSION);

program
  .command('init')
  .description('交互式初始化 Gant-Agent 配置')
  .option('-f, --force', '覆盖已有配置')
  .option('-l, --local', '创建项目级配置（当前目录）')
  .option('--jsonc', '使用 JSONC 格式（带注释的 JSON）')
  .action(async (options) => {
    const { initCommand } = await import('./commands/init.js');
    await initCommand(options);
  });

program
  .command('sync')
  .description('同步所有知识源并更新锁定文件')
  .option('-d, --dry-run', '预览变更，不实际执行')
  .option('-v, --verbose', '显示详细日志')
  .option('--auto', '自动检测并生成 Profiles')
  .action(async (options) => {
    const { syncCommand } = await import('./commands/sync.js');
    await syncCommand(options);
  });

program
  .command('use <profile>')
  .description('切换到指定的 Profile')
  .action(async (profile) => {
    const { useCommand } = await import('./commands/use.js');
    await useCommand(profile);
  });

program
  .command('status')
  .description('显示当前状态')
  .action(async () => {
    const { statusCommand } = await import('./commands/status.js');
    await statusCommand();
  });

program
  .command('list')
  .description('列出所有 Skills')
  .option('-p, --profile <profile>', '列出指定 Profile 的 Skills')
  .option('-a, --auto', '列出自动检测的 Profiles')
  .action(async (options) => {
    const { listCommand } = await import('./commands/list.js');
    await listCommand(options);
  });

program
  .command('doctor')
  .description('诊断环境并修复常见问题')
  .option('--status', '显示紧凑状态摘要')
  .option('--verbose', '显示详细诊断信息')
  .option('--json', '以 JSON 格式输出')
  .action(async (options) => {
    const { doctorCommand } = await import('./commands/doctor.js');
    await doctorCommand(options);
  });

program
  .command('remove <profile>')
  .description('删除指定的 Profile 及其符号链接')
  .action(async (profile) => {
    const { removeCommand } = await import('./commands/remove.js');
    await removeCommand(profile);
  });

program
  .command('uninstall')
  .description('卸载 Gant-Agent，清理所有配置和符号链接')
  .action(async () => {
    const { uninstallCommand } = await import('./commands/uninstall.js');
    await uninstallCommand();
  });

program.parse();

checkForUpdatesBackground(VERSION);
