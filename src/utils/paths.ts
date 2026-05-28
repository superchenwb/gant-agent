import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Gant-Agent 路径常量
 *
 * 支持项目级配置和用户级配置：
 * 1. 从当前目录向上查找 .gant-agent/gant.yaml
 * 2. 找到则使用项目级路径（./.gant-agent/）
 * 3. 没找到则回退到用户级路径（~/.gant-agent/）
 */

export const GANT_AGENT_HOME = join(homedir(), '.gant-agent');
export const PROJECT_CONFIG_DIR = '.gant-agent';

export const AGENT_DIRECTORIES: Array<{ name: string; dir: string }> = [
  { name: 'opencode', dir: '.opencode' },
  { name: 'claude', dir: '.claude' },
  { name: 'cursor', dir: '.cursor' },
  { name: 'qoder', dir: '.qoder' },
];

export interface GantPaths {
  home: string;
  config: string;
  configName: string;
  lock: string;
  cache: string;
  profiles: string;
  logs: string;
}

const CONFIG_NAMES = ['gant.jsonc', 'gant.json', 'gant.yaml'];

function findProjectRoot(startDir: string = process.cwd()): string | null {
  for (const configName of CONFIG_NAMES) {
    const configPath = join(startDir, PROJECT_CONFIG_DIR, configName);
    if (existsSync(configPath)) {
      return join(startDir, PROJECT_CONFIG_DIR);
    }
  }

  const parentDir = resolve(startDir, '..');
  if (parentDir === startDir) {
    return null;
  }

  return findProjectRoot(parentDir);
}

function findConfigName(home: string): string {
  for (const name of CONFIG_NAMES) {
    if (existsSync(join(home, name))) {
      return name;
    }
  }
  return 'gant.yaml';
}

/**
 * 构建路径对象
 */
function buildPaths(home: string): GantPaths {
  const configName = findConfigName(home);
  return {
    home,
    config: join(home, configName),
    configName,
    lock: join(home, 'gant.lock'),
    cache: join(home, 'cache'),
    profiles: join(home, 'profiles'),
    logs: join(home, 'logs'),
  };
}

export function getProjectDir(projectRoot?: string | null): string | null {
  if (projectRoot === undefined) {
    projectRoot = findProjectRoot();
  }
  if (!projectRoot) return null;
  return resolve(projectRoot, '..');
}

export function discoverProjectAgents(projectDir?: string | null): Record<string, string> {
  if (projectDir === null) return {};
  if (projectDir === undefined) {
    projectDir = getProjectDir();
  }
  if (!projectDir) return {};

  const agents: Record<string, string> = {};
  for (const { name, dir } of AGENT_DIRECTORIES) {
    const agentRootPath = join(projectDir, dir);
    if (existsSync(agentRootPath)) {
      agents[name] = join(agentRootPath, 'skills');
    }
  }

  return agents;
}

/**
 * 获取当前激活的路径
 * 优先使用项目级配置，回退到用户级配置
 */
let cachedPaths: GantPaths | null = null;
export function getPaths(): GantPaths {
  if (cachedPaths) {
    return cachedPaths;
  }

  const projectRoot = findProjectRoot();
  const home = projectRoot || GANT_AGENT_HOME;
  cachedPaths = buildPaths(home);

  return cachedPaths;
}

/**
 * 重置路径缓存（用于测试或配置切换后）
 */
export function resetPaths(): void {
  cachedPaths = null;
}

/**
 * 兼容性导出：使用 Proxy 保持原有 PATHS.xxx 用法
 * 所有现有代码无需修改即可支持项目级配置
 */
export const PATHS = new Proxy({} as GantPaths, {
  get(_target, prop: keyof GantPaths) {
    return getPaths()[prop];
  },
});

/**
 * 判断当前是否使用项目级配置
 */
export function isProjectMode(): boolean {
  return getPaths().home !== GANT_AGENT_HOME;
}

/**
 * 获取当前配置来源的描述
 */
export function getConfigSource(): string {
  return isProjectMode() ? '项目级配置' : '用户级配置';
}

export function getSourceCachePath(sourceName: string, commitSha: string): string {
  const shortSha = commitSha.slice(0, 8);
  return join(getPaths().cache, `${sourceName}@${shortSha}`);
}

export function getEditableSourcePath(sourceName: string): string {
  return join(getPaths().home, 'sources', sourceName);
}

export function getProfilePath(profileName: string): string {
  return join(getPaths().profiles, profileName);
}

export function getProfileSkillPath(profileName: string, skillName: string): string {
  return join(getPaths().profiles, profileName, skillName);
}

export function expandHome(path: string): string {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  return path;
}
