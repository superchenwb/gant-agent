import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { cwd } from 'node:process';
import chalk from 'chalk';

const CACHE_FILE = join(homedir(), '.gant-agent', '.version-cache');
const CACHE_TTL = 24 * 60 * 60 * 1000;
const NPM_FETCH_TIMEOUT = 5000;
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/-/package/gant-agent/dist-tags';
const PACKAGE_NAME = 'gant-agent';

interface VersionCache {
  [channel: string]: {
    latestVersion: string;
    checkedAt: number;
  };
}

/**
 * Extract release channel from a version string.
 * Examples:
 *   "0.1.0" -> "latest"
 *   "0.1.0-beta.1" -> "beta"
 *   "0.1.0-alpha.2" -> "alpha"
 *   "next" -> "next"
 */
export function extractChannel(version: string): string {
  if (!version) return 'latest';

  if (!/^\d/.test(version)) {
    return version;
  }

  if (version.includes('-')) {
    const prereleasePart = version.split('-')[1];
    if (prereleasePart) {
      const channelMatch = prereleasePart.match(/^(alpha|beta|rc|canary|next)/);
      if (channelMatch) {
        return channelMatch[1];
      }
    }
  }

  return 'latest';
}

/**
 * Detect if running in local development mode.
 * Walks up from cwd looking for package.json with name 'gant-agent'.
 */
export function isLocalDevMode(): boolean {
  return getLocalDevPath() !== null;
}

function readPackageName(pkgPath: string): string | null {
  if (!existsSync(pkgPath)) return null;
  try {
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as { name?: string };
    return pkg.name ?? null;
  } catch {
    return null;
  }
}

function getLocalDevPath(): string | null {
  let dir = cwd();

  for (let i = 0; i < 10; i++) {
    const pkgPath = join(dir, 'package.json');
    const name = readPackageName(pkgPath);
    if (name === PACKAGE_NAME) {
      return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

function readCache(): VersionCache | null {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    const cache: VersionCache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    return cache;
  } catch {
    return null;
  }
}

function readChannelCache(channel: string): string | null {
  const cache = readCache();
  if (!cache || !cache[channel]) return null;
  if (Date.now() - cache[channel].checkedAt > CACHE_TTL) return null;
  return cache[channel].latestVersion;
}

function writeChannelCache(channel: string, latestVersion: string): void {
  try {
    const cache = readCache() ?? {};
    cache[channel] = { latestVersion, checkedAt: Date.now() };
    writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {
    return;
  }
}

export async function getLatestVersion(channel: string = 'latest'): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NPM_FETCH_TIMEOUT);

  try {
    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, string>;
    return data[channel] ?? data.latest ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getInstallCommand(channel: string): string {
  if (channel === 'latest') {
    return 'npm install -g gant-agent';
  }
  return `npm install -g gant-agent@${channel}`;
}

/**
 * Check for updates asynchronously.
 * Skips check entirely if running in local dev mode.
 * Never throws - all errors are silently caught.
 */
export async function checkForUpdates(currentVersion: string): Promise<void> {
  if (isLocalDevMode()) {
    return;
  }

  const channel = extractChannel(currentVersion);
  let latestVersion = readChannelCache(channel);

  if (!latestVersion) {
    latestVersion = await getLatestVersion(channel);
    if (latestVersion) {
      writeChannelCache(channel, latestVersion);
    }
  }

  if (!latestVersion) return;

  if (latestVersion !== currentVersion) {
    const installCmd = getInstallCommand(channel);
    console.error(chalk.yellow(`\n⚠  gant-agent 有新版本可用: ${currentVersion} → ${latestVersion}`));
    console.error(chalk.yellow(`   运行 ${installCmd} 更新\n`));
  }
}

/**
 * Non-blocking wrapper for CLI startup.
 * Runs check in background so it never delays command execution.
 */
export function checkForUpdatesBackground(currentVersion: string): void {
  setTimeout(() => {
    checkForUpdates(currentVersion).catch(() => {
      return;
    });
  }, 0);
}
