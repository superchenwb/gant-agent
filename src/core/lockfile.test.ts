import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { writeLock, readLock, createEmptyLock } from './lockfile.js';
import { PATHS } from '../utils/paths.js';
import type { GantLock } from '../models/config.js';

describe('lockfile', () => {
  const lockPath = PATHS.lock;

  beforeEach(() => {
    if (existsSync(lockPath)) {
      rmSync(lockPath);
    }
  });

  afterEach(() => {
    if (existsSync(lockPath)) {
      rmSync(lockPath);
    }
  });

  describe('createEmptyLock', () => {
    it('should create empty lock structure', () => {
      const lock = createEmptyLock();

      expect(lock.version).toBe('1.0');
      expect(lock.generatedAt).toBeDefined();
      expect(lock.sources).toEqual({});
      expect(lock.profiles).toEqual({});

      const date = new Date(lock.generatedAt);
      expect(date.toISOString()).toBe(lock.generatedAt);
    });
  });

  describe('writeLock & readLock', () => {
    it('should write and read lockfile', () => {
      const lock: GantLock = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        sources: {
          'my-repo': {
            repo: 'git@example.com/repo.git',
            resolvedVersion: 'main',
            resolvedCommit: 'abc123',
            skills: [
              { name: 'test-skill', path: 'skills/test', source: 'my-repo' },
            ],
          },
        },
        profiles: {
          default: {
            active: true,
            linkedSkills: [
              { name: 'test-skill', source: 'my-repo', targetPath: '/tmp/test' },
            ],
          },
        },
      };

      writeLock(lock);
      const read = readLock();

      expect(read).not.toBeNull();
      expect(read!.version).toBe('1.0');
      expect(read!.sources['my-repo'].resolvedCommit).toBe('abc123');
      expect(read!.sources['my-repo'].skills[0].name).toBe('test-skill');
      expect(read!.profiles.default.active).toBe(true);
    });

    it('should return null when lockfile does not exist', () => {
      const lock = readLock();
      expect(lock).toBeNull();
    });

    it('should overwrite existing lockfile', () => {
      const lock1: GantLock = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        sources: {},
        profiles: {},
      };

      const lock2: GantLock = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        sources: {
          repo2: {
            resolvedVersion: 'v2',
            resolvedCommit: 'def456',
            skills: [],
          },
        },
        profiles: {},
      };

      writeLock(lock1);
      writeLock(lock2);

      const read = readLock();
      expect(read!.sources.repo2).toBeDefined();
      expect(read!.sources.repo2.resolvedCommit).toBe('def456');
    });
  });
});
