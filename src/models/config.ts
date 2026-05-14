/**
 * Gant-Agent 配置模型
 * 定义 gant.yaml 和 gant.lock 的数据结构
 */

// ─────────────────────────────────────────
// Source 定义
// ─────────────────────────────────────────

export interface RemoteSource {
  repo: string;
  version: string;
  path?: string;
}

export interface LocalSource {
  localPath: string;
}

export type Source = RemoteSource | LocalSource;

export function isRemoteSource(source: Source): source is RemoteSource {
  return 'repo' in source;
}

export function isLocalSource(source: Source): source is LocalSource {
  return 'localPath' in source;
}

export type SourceConfig = Source & {
  name: string;
}

export type Profile = string[];

export type Profiles = Record<string, Profile>;

export interface Settings {
  omcConfigPath: string;
  agentPaths: Record<string, string>;
  linkStrategy: 'symlink' | 'hardlink' | 'copy';
  autoCheckUpdate: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  omcConfigPath: '~/.config/opencode/oh-my-openagent.json',
  agentPaths: {
    opencode: '~/.opencode/skills',
    claude: '~/.claude/skills',
    cursor: '~/.cursor/skills',
  },
  linkStrategy: 'symlink',
  autoCheckUpdate: true,
};

export interface GantConfig {
  version: string;
  sources: Record<string, Source>;
  profiles: Profiles;
  settings?: Partial<Settings>;
}

export interface Skill {
  name: string;
  path: string;
  source: string;
}

export interface LockedSource {
  repo?: string;
  localPath?: string;
  resolvedVersion: string;
  resolvedCommit: string;
  path?: string;
  skills: Skill[];
}

export interface LockedProfile {
  active: boolean;
  linkedSkills: Array<{
    name: string;
    source: string;
    targetPath: string;
  }>;
}

export interface GantLock {
  version: string;
  generatedAt: string;
  sources: Record<string, LockedSource>;
  profiles: Record<string, LockedProfile>;
}
