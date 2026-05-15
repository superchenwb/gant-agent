import { spawn } from 'node:child_process';
import chalk from 'chalk';
import { getLatestVersion, isLocalDevMode } from '../utils/version-check.js';

const PACKAGE_NAME = 'gant-agent';

export async function upgradeCommand(currentVersion: string): Promise<void> {
  if (isLocalDevMode()) {
    console.log(chalk.yellow('当前处于本地开发模式，跳过自动升级。'));
    console.log(chalk.gray('如需升级，请在项目目录运行：'));
    console.log(chalk.cyan('  npm install -g gant-agent'));
    return;
  }

  console.log(chalk.bold('检查 gant-agent 更新...'));
  console.log(chalk.gray(`当前版本: ${currentVersion}`));

  const latestVersion = await getLatestVersion();

  if (!latestVersion) {
    console.error(chalk.red('无法获取最新版本信息，请检查网络连接。'));
    process.exit(1);
  }

  console.log(chalk.gray(`最新版本: ${latestVersion}`));

  if (latestVersion === currentVersion) {
    console.log(chalk.green('✓ 已是最新版本，无需升级。'));
    return;
  }

  if (!isNewerVersion(latestVersion, currentVersion)) {
    console.log(chalk.green('✓ 当前版本已领先于最新发布版本。'));
    return;
  }

  console.log('');
  console.log(chalk.yellow(`发现新版本: ${currentVersion} → ${latestVersion}`));
  console.log('');

  console.log(chalk.bold('升级命令:'));
  console.log(chalk.cyan(`  npm install -g ${PACKAGE_NAME}`));
  console.log('');

  console.log(chalk.gray('正在执行升级...'));
  console.log('');

  try {
    await runNpmUpgrade();
    console.log(chalk.green('✓ 升级成功！'));
    console.log(chalk.gray('请重新运行 gant 命令以使用新版本。'));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`升级失败: ${msg}`));
    console.error(chalk.gray('请手动运行: npm install -g gant-agent'));
    process.exit(1);
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const l = parse(latest);
  const c = parse(current);

  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

function runNpmUpgrade(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install', '-g', PACKAGE_NAME], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install 退出码: ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
