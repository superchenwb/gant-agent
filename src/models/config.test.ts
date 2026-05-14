import { describe, it, expect } from 'vitest';
import { isRemoteSource, isLocalSource } from './config.js';
import type { Source } from './config.js';

describe('config models', () => {
  describe('isRemoteSource', () => {
    it('should return true for remote source', () => {
      const source: Source = { repo: 'git@example.com/repo.git', version: 'main' };
      expect(isRemoteSource(source)).toBe(true);
    });

    it('should return false for local source', () => {
      const source: Source = { localPath: '/path/to/repo' };
      expect(isRemoteSource(source)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const source: Source = { repo: 'git@example.com/repo.git', version: 'main' };
      if (isRemoteSource(source)) {
        expect(source.repo).toBe('git@example.com/repo.git');
        expect(source.version).toBe('main');
      }
    });
  });

  describe('isLocalSource', () => {
    it('should return true for local source', () => {
      const source: Source = { localPath: '/path/to/repo' };
      expect(isLocalSource(source)).toBe(true);
    });

    it('should return false for remote source', () => {
      const source: Source = { repo: 'git@example.com/repo.git', version: 'main' };
      expect(isLocalSource(source)).toBe(false);
    });

    it('should narrow type correctly', () => {
      const source: Source = { localPath: '/path/to/repo' };
      if (isLocalSource(source)) {
        expect(source.localPath).toBe('/path/to/repo');
      }
    });
  });
});
