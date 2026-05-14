import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadConfig } from './config.js';
import { PATHS } from '../utils/paths.js';

describe('config loader', () => {
  const testConfigPath = PATHS.config;

  beforeEach(() => {
    mkdirSync(dirname(testConfigPath), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath);
    }
  });

  it('should throw when config file does not exist', () => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath);
    }
    expect(() => loadConfig()).toThrow('配置文件不存在');
  });

  it('should load valid config', () => {
    const config = {
      version: '1.0',
      sources: {
        wiki: {
          repo: 'git@example.com/wiki.git',
          version: 'main',
        },
      },
      profiles: {
        default: ['wiki'],
      },
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    const loaded = loadConfig();

    expect(loaded.version).toBe('1.0');
    expect(loaded.sources.wiki).toEqual({
      repo: 'git@example.com/wiki.git',
      version: 'main',
    });
    expect(loaded.profiles.default).toEqual(['wiki']);
  });

  it('should throw when version is missing', () => {
    const config = {
      sources: {},
      profiles: {},
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('配置缺少 version 字段');
  });

  it('should throw when sources is missing', () => {
    const config = {
      version: '1.0',
      profiles: {},
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('配置缺少 sources 字段');
  });

  it('should throw when profiles is missing', () => {
    const config = {
      version: '1.0',
      sources: {},
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('配置缺少 profiles 字段');
  });

  it('should throw when source has both repo and localPath', () => {
    const config = {
      version: '1.0',
      sources: {
        bad: {
          repo: 'git@example.com/repo.git',
          version: 'main',
          localPath: '/some/path',
        },
      },
      profiles: {},
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('不能同时指定 repo 和 localPath');
  });

  it('should throw when remote source lacks version', () => {
    const config = {
      version: '1.0',
      sources: {
        bad: {
          repo: 'git@example.com/repo.git',
        },
      },
      profiles: {},
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('必须指定 version');
  });

  it('should throw when source has neither repo nor localPath', () => {
    const config = {
      version: '1.0',
      sources: {
        bad: {
          name: 'test',
        },
      },
      profiles: {},
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('必须指定 repo 或 localPath');
  });

  it('should throw when profile references undefined source', () => {
    const config = {
      version: '1.0',
      sources: {},
      profiles: {
        bad: ['missing'],
      },
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('引用了未定义的 source');
  });

  it('should throw when profile is not an array', () => {
    const config = {
      version: '1.0',
      sources: {},
      profiles: {
        bad: 'not-array',
      },
    };

    writeFileSync(testConfigPath, JSON.stringify(config), 'utf-8');
    expect(() => loadConfig()).toThrow('必须是 source 名称数组');
  });
});
