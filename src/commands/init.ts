import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cwd } from 'node:process';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { GANT_AGENT_HOME } from '../utils/paths.js';

interface InitOptions {
  force?: boolean;
  local?: boolean;
  jsonc?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const targetHome = options.local
    ? join(cwd(), '.gant-agent')
    : GANT_AGENT_HOME;
  const ext = options.jsonc ? 'jsonc' : 'yaml';
  const targetConfig = join(targetHome, `gant.${ext}`);

  if (existsSync(targetConfig) && !options.force) {
    console.error(chalk.red(`配置文件已存在: ${targetConfig}`));
    console.error('使用 --force 覆盖');
    process.exit(1);
  }

  mkdirSync(dirname(targetConfig), { recursive: true });

  const config = {
    version: '1.0',
    sources: {} as Record<string, unknown>,
    profiles: {
      default: [],
    } as Record<string, string[]>,
  };

  if (options.jsonc) {
    const jsoncContent = formatJsonc(config);
    writeFileSync(targetConfig, jsoncContent, 'utf-8');
  } else {
    writeFileSync(
      targetConfig,
      yaml.dump(config, { indent: 2, lineWidth: -1, noRefs: true }),
      'utf-8'
    );
  }

  const configType = options.local ? '项目级' : '用户级';
  console.log(chalk.green(`✓ ${configType}配置文件已创建: ${targetConfig}`));
  console.log('');
  console.log('下一步：');
  const configFileName = options.jsonc ? `gant.${ext}` : 'gant.yaml';
  if (options.local) {
    console.log(`  1. 编辑 .gant-agent/${configFileName} 自定义项目配置`);
  } else {
    console.log(`  1. 编辑 ~/.gant-agent/${configFileName} 自定义配置`);
  }
  console.log('  2. 运行 gant sync 下载知识库');
  console.log('  3. 运行 gant use default 激活配置');
}

function formatJsonc(config: Record<string, unknown>): string {
  const lines: string[] = [
    '{',
    '  // Gant-Agent 配置文件',
    '  // 支持 JSON with Comments (JSONC) 格式',
    `  "version": ${JSON.stringify(config.version)},`,
    '',
    '  // 知识源配置：添加你的知识库（远程仓库或本地目录）',
    '  "sources": {},',
    '',
    '  // Profile 配置：定义不同的技能组合',
    '  "profiles": {',
    '    "default": []',
    '  }',
    '}',
    '',
  ];

  return lines.join('\n');
}
