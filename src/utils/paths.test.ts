import { describe, it, expect } from 'vitest';
import {
  GANT_AGENT_HOME,
  PATHS,
  getSourceCachePath,
  getProfilePath,
  getProfileSkillPath,
  expandHome,
  getProjectDir,
  discoverProjectAgents,
} from './paths.js';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

describe('paths', () => {
  describe('PATHS', () => {
    it('should define correct home path', () => {
      expect(PATHS.home).toBe(GANT_AGENT_HOME);
      expect(PATHS.home).toContain('.gant-agent');
    });

    it('should define correct config path', () => {
      expect(PATHS.config).toBe(join(GANT_AGENT_HOME, 'gant.yaml'));
    });

    it('should define correct lock path', () => {
      expect(PATHS.lock).toBe(join(GANT_AGENT_HOME, 'gant.lock'));
    });

    it('should define correct cache path', () => {
      expect(PATHS.cache).toBe(join(GANT_AGENT_HOME, 'cache'));
    });

    it('should define correct profiles path', () => {
      expect(PATHS.profiles).toBe(join(GANT_AGENT_HOME, 'profiles'));
    });

    it('should define correct logs path', () => {
      expect(PATHS.logs).toBe(join(GANT_AGENT_HOME, 'logs'));
    });
  });

  describe('getSourceCachePath', () => {
    it('should create cache path with short sha', () => {
      const path = getSourceCachePath('my-repo', 'abc123def4567890');
      expect(path).toBe(join(PATHS.cache, 'my-repo@abc123de'));
    });

    it('should handle commit sha of exactly 8 chars', () => {
      const path = getSourceCachePath('repo', 'abcdef12');
      expect(path).toBe(join(PATHS.cache, 'repo@abcdef12'));
    });
  });

  describe('getProfilePath', () => {
    it('should create profile path', () => {
      const path = getProfilePath('frontend');
      expect(path).toBe(join(PATHS.profiles, 'frontend'));
    });
  });

  describe('getProfileSkillPath', () => {
    it('should create profile skill path', () => {
      const path = getProfileSkillPath('frontend', 'react');
      expect(path).toBe(join(PATHS.profiles, 'frontend', 'react'));
    });
  });

  describe('expandHome', () => {
    it('should expand ~ to home directory', () => {
      const expanded = expandHome('~/test');
      expect(expanded).toBe(join(homedir(), 'test'));
    });

    it('should leave absolute paths unchanged', () => {
      const path = '/usr/local/bin';
      expect(expandHome(path)).toBe(path);
    });

    it('should leave relative paths unchanged', () => {
      const path = './test';
      expect(expandHome(path)).toBe(path);
    });

    it('should not expand ~ in the middle of path', () => {
      const path = '/foo~/bar';
      expect(expandHome(path)).toBe(path);
    });
  });

  describe('getProjectDir', () => {
    it('should return null when no project config exists', () => {
      expect(getProjectDir()).toBeNull();
    });
  });

  describe('discoverProjectAgents', () => {
    it('should return empty object when no project config exists', () => {
      expect(discoverProjectAgents()).toEqual({});
    });

    it('should detect project-level agents', () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'gant-test-'));
      const projectDir = join(tmpDir, 'my-project');

      mkdirSync(join(projectDir, '.opencode', 'skills'), { recursive: true });
      mkdirSync(join(projectDir, '.claude', 'skills'), { recursive: true });

      try {
        const agents = discoverProjectAgents(projectDir);
        expect(Object.keys(agents)).toContain('opencode');
        expect(Object.keys(agents)).toContain('claude');
        expect(agents.opencode).toBe(join(projectDir, '.opencode', 'skills'));
        expect(agents.claude).toBe(join(projectDir, '.claude', 'skills'));
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
