import { Command } from 'commander';
import {
  getPreference,
  setPreference,
  listPreferences,
} from '../core/preference-store.js';

export function createPreferenceCommand(): Command {
  const cmd = new Command('preference')
    .description('管理 Gant-Question 安装偏好')
    .option('-c, --check <questionId>', '检查偏好（输出 ASK_NORMALLY 或 AUTO_DECIDE:<option>）')
    .option('-s, --set <questionId>', '设置偏好（需配合 --value）')
    .option('-v, --value <option>', '偏好值')
    .option('-l, --list', '列出所有已保存的偏好')
    .option('--one-way', '标记为 one-way（--check 时强制返回 ASK_NORMALLY）')
    .action(async (options) => {
      try {
        if (options.check) {
          const result = await getPreference(options.check, !!options.oneWay);
          if (result.action === 'AUTO_DECIDE' && result.option) {
            console.log(`AUTO_DECIDE:${result.option}`);
          } else {
            console.log('ASK_NORMALLY');
          }
          return;
        }

        if (options.set) {
          if (!options.value) {
            console.error('Error: --set 需要配合 --value 使用');
            process.exit(1);
          }
          await setPreference(options.set, options.value);
          console.log(`已保存: ${options.set} = ${options.value}`);
          return;
        }

        if (options.list) {
          const prefs = await listPreferences();
          if (Object.keys(prefs).length === 0) {
            console.log('暂无保存的偏好');
            return;
          }
          for (const [id, val] of Object.entries(prefs)) {
            console.log(`${id}: ${val}`);
          }
          return;
        }

        cmd.help();
      } catch (err) {
        console.error('Error:', (err as Error).message);
        process.exit(1);
      }
    });

  return cmd;
}
