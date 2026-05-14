import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cwd } from 'node:process';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { GANT_AGENT_HOME } from '../utils/paths.js';

interface InitOptions {
  force?: boolean;
  local?: boolean;
}

interface SourceTemplate {
  name: string;
  description: string;
  source: Record<string, unknown>;
}

const SOURCE_TEMPLATES: SourceTemplate[] = [
  {
    name: 'yadea-bom',
    description: '雅迪 BOM 业务知识库',
    source: {
      repo: 'git@codeup.aliyun.com:gant/wiki/yadea-wiki.git',
      version: 'main',
      path: 'skills/',
    },
  },
  {
    name: 'gant-skills',
    description: 'Gant 技术技能包',
    source: {
      repo: 'git@codeup.aliyun.com:gant/Project-AI/gant-skills.git',
      version: 'main',
    },
  },
];

export async function initCommand(options: InitOptions): Promise<void> {
  const targetHome = options.local
    ? join(cwd(), '.gant-agent')
    : GANT_AGENT_HOME;
  const targetConfig = join(targetHome, 'gant.yaml');

  if (existsSync(targetConfig) && !options.force) {
    console.error(chalk.red(`配置文件已存在: ${targetConfig}`));
    console.error('使用 --force 覆盖');
    process.exit(1);
  }

  mkdirSync(dirname(targetConfig), { recursive: true });

  const sources: Record<string, unknown> = {};
  for (const template of SOURCE_TEMPLATES) {
    sources[template.name] = template.source;
  }

  const config = {
    version: '1.0',
    sources,
    profiles: {
      default: ['yadea-bom'],
      frontend: ['yadea-bom', 'gant-skills'],
      backend: ['yadea-bom', 'gant-skills'],
      fullstack: ['yadea-bom', 'gant-skills'],
    } as Record<string, string[]>,
  };

  writeFileSync(
    targetConfig,
    yaml.dump(config, { indent: 2, lineWidth: -1, noRefs: true }),
    'utf-8'
  );

  const configType = options.local ? '项目级' : '用户级';
  console.log(chalk.green(`✓ ${configType}配置文件已创建: ${targetConfig}`));
  console.log('');
  console.log('下一步：');
  if (options.local) {
    console.log('  1. 编辑 .gant-agent/gant.yaml 自定义项目配置');
  } else {
    console.log('  1. 编辑 ~/.gant-agent/gant.yaml 自定义配置');
  }
  console.log('  2. 运行 gant sync 下载知识库');
  console.log('  3. 运行 gant use default 激活配置');
}
