import chalk from 'chalk';
import { runDoctor } from '../cli/doctor/runner.js';
import {
  formatDefaultOutput,
  formatStatusOutput,
  formatVerboseOutput,
  formatJsonOutput,
} from '../cli/doctor/formatter.js';

export interface DoctorCommandOptions {
  status?: boolean;
  verbose?: boolean;
  json?: boolean;
}

export async function doctorCommand(options: DoctorCommandOptions = {}): Promise<void> {
  try {
    const result = await runDoctor();

    let output: string;
    if (options.json) {
      output = formatJsonOutput(result);
    } else if (options.status) {
      output = formatStatusOutput(result);
    } else if (options.verbose) {
      output = formatVerboseOutput(result);
    } else {
      output = formatDefaultOutput(result);
    }

    console.log(output);

    if (result.exitCode !== 0) {
      process.exit(result.exitCode);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('\nDoctor 诊断失败:'), message);
    console.error(chalk.gray('尝试运行: gant doctor --verbose 查看详细信息\n'));
    process.exit(1);
  }
}
