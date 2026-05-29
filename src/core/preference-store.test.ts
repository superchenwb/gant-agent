import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  getPreference,
  setPreference,
  listPreferences,
} from './preference-store.js';

describe('preference-store', () => {
  const tempDir = path.join(os.tmpdir(), 'gant-agent-test-' + Date.now());
  const prefsFile = path.join(tempDir, 'question-preferences.json');

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
    process.env.GANT_AGENT_TEST_PREFS_DIR = tempDir;
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    delete process.env.GANT_AGENT_TEST_PREFS_DIR;
  });

  it('returns ASK_NORMALLY when preference file does not exist', async () => {
    const result = await getPreference('installation-config-level', false, tempDir);
    expect(result).toEqual({ action: 'ASK_NORMALLY' });
  });

  it('returns AUTO_DECIDE when two-way preference exists', async () => {
    await fs.writeJson(prefsFile, { 'installation-config-level': 'local' });
    const result = await getPreference('installation-config-level', false, tempDir);
    expect(result).toEqual({ action: 'AUTO_DECIDE', option: 'local' });
  });

  it('returns ASK_NORMALLY for one-way even if preference exists', async () => {
    await fs.writeJson(prefsFile, { 'installation-config-level': 'local' });
    const result = await getPreference('installation-config-level', true, tempDir);
    expect(result).toEqual({ action: 'ASK_NORMALLY' });
  });

  it('setPreference writes to file', async () => {
    await setPreference('installation-config-level', 'local', tempDir);
    const content = await fs.readJson(prefsFile);
    expect(content).toEqual({ 'installation-config-level': 'local' });
  });

  it('listPreferences returns empty object when no file', async () => {
    const result = await listPreferences(tempDir);
    expect(result).toEqual({});
  });

  it('listPreferences returns all preferences', async () => {
    await fs.writeJson(prefsFile, { a: '1', b: '2' });
    const result = await listPreferences(tempDir);
    expect(result).toEqual({ a: '1', b: '2' });
  });
});
