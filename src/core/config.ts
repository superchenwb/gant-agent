import { readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { GantConfig, DEFAULT_SETTINGS, type Settings } from '../models/config.js';
import { PATHS } from '../utils/paths.js';

export function loadConfig(): GantConfig {
  if (!existsSync(PATHS.config)) {
    throw new Error(
      `配置文件不存在: ${PATHS.config}\n请运行 'gant init' 初始化配置。`
    );
  }

  const content = readFileSync(PATHS.config, 'utf-8');
  const parsed = yaml.load(content) as Record<string, unknown>;

  validateConfig(parsed);

  const settings: Partial<Settings> = {
    ...DEFAULT_SETTINGS,
    ...(parsed.settings as Partial<Settings> || {}),
  };

  return {
    version: parsed.version as string,
    sources: parsed.sources as GantConfig['sources'],
    profiles: parsed.profiles as GantConfig['profiles'],
    settings,
  };
}

function validateConfig(config: Record<string, unknown>): void {
  if (!config.version || typeof config.version !== 'string') {
    throw new Error('配置缺少 version 字段');
  }

  if (!config.sources || typeof config.sources !== 'object') {
    throw new Error('配置缺少 sources 字段');
  }

  if (!config.profiles || typeof config.profiles !== 'object') {
    throw new Error('配置缺少 profiles 字段');
  }

  const sources = config.sources as Record<string, unknown>;
  const profiles = config.profiles as Record<string, unknown>;

  for (const [name, source] of Object.entries(sources)) {
    if (!source || typeof source !== 'object') {
      throw new Error(`Source "${name}" 格式错误`);
    }

    const s = source as Record<string, unknown>;

    if ('repo' in s && 'localPath' in s) {
      throw new Error(`Source "${name}" 不能同时指定 repo 和 localPath`);
    }

    if ('repo' in s) {
      if (!s.version || typeof s.version !== 'string') {
        throw new Error(`远程 Source "${name}" 必须指定 version`);
      }
    } else if (!('localPath' in s)) {
      throw new Error(`Source "${name}" 必须指定 repo 或 localPath`);
    }
  }

  for (const [profileName, sourceList] of Object.entries(profiles)) {
    if (!Array.isArray(sourceList)) {
      throw new Error(`Profile "${profileName}" 必须是 source 名称数组`);
    }

    for (const sourceName of sourceList) {
      if (typeof sourceName !== 'string') {
        throw new Error(`Profile "${profileName}" 中包含无效的 source 名称`);
      }
      if (!sources[sourceName]) {
        throw new Error(
          `Profile "${profileName}" 引用了未定义的 source: "${sourceName}"`
        );
      }
    }
  }
}
