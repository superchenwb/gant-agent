import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { GantLock } from '../models/config.js';
import { PATHS } from '../utils/paths.js';

export function writeLock(lock: GantLock): void {
  const content = yaml.dump(lock, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
  });
  writeFileSync(PATHS.lock, content, 'utf-8');
}

export function readLock(): GantLock | null {
  if (!existsSync(PATHS.lock)) return null;
  const content = readFileSync(PATHS.lock, 'utf-8');
  return yaml.load(content) as GantLock;
}

export function createEmptyLock(): GantLock {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    sources: {},
    profiles: {},
  };
}
