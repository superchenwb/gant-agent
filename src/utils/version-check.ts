import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import chalk from 'chalk';

const CACHE_FILE = join(homedir(), '.gant-agent', '.version-cache');
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface VersionCache {
  latestVersion: string;
  checkedAt: number;
}

function getLatestVersion(): string | null {
  try {
    const result = execSync('npm view gant-agent version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return result;
  } catch {
    return null;
  }
}

function readCache(): VersionCache | null {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    const cache: VersionCache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    if (Date.now() - cache.checkedAt > CACHE_TTL) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(latestVersion: string): void {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify({ latestVersion, checkedAt: Date.now() }));
  } catch {
    return;
  }
}

export function checkForUpdates(currentVersion: string): void {
  setTimeout(() => {
    const cache = readCache();
    let latestVersion: string | null;

    if (cache) {
      latestVersion = cache.latestVersion;
    } else {
      latestVersion = getLatestVersion();
      if (latestVersion) writeCache(latestVersion);
    }

    if (!latestVersion) return;

    if (latestVersion !== currentVersion) {
      console.error(chalk.yellow(`\n⚠  gant-agent 有新版本可用: ${currentVersion} → ${latestVersion}`));
      console.error(chalk.yellow(`   运行 npm install -g gant-agent 更新\n`));
    }
  }, 0);
}
