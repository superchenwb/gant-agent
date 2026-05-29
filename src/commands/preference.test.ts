import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createPreferenceCommand } from './preference.js';

describe('preference command', () => {
  const tempDir = path.join(os.tmpdir(), 'gant-agent-cmd-test-' + Date.now());
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
    process.env.GANT_AGENT_TEST_PREFS_DIR = tempDir;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    delete process.env.GANT_AGENT_TEST_PREFS_DIR;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('--check returns ASK_NORMALLY when no preference', async () => {
    const cmd = createPreferenceCommand();
    await cmd.parseAsync(['node', 'gant', 'preference', '--check', 'test-qid']);
    expect(consoleLogSpy).toHaveBeenCalledWith('ASK_NORMALLY');
  });

  it('--check returns AUTO_DECIDE when preference exists', async () => {
    const prefsFile = path.join(tempDir, 'question-preferences.json');
    await fs.writeJson(prefsFile, { 'test-qid': 'option-a' });

    const cmd = createPreferenceCommand();
    await cmd.parseAsync(['node', 'gant', 'preference', '--check', 'test-qid']);
    expect(consoleLogSpy).toHaveBeenCalledWith('AUTO_DECIDE:option-a');
  });

  it('--one-way forces ASK_NORMALLY even when preference exists', async () => {
    const prefsFile = path.join(tempDir, 'question-preferences.json');
    await fs.writeJson(prefsFile, { 'test-qid': 'option-a' });

    const cmd = createPreferenceCommand();
    await cmd.parseAsync(['node', 'gant', 'preference', '--check', 'test-qid', '--one-way']);
    expect(consoleLogSpy).toHaveBeenCalledWith('ASK_NORMALLY');
  });
});
