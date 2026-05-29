import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export interface PreferenceResult {
  action: 'ASK_NORMALLY' | 'AUTO_DECIDE';
  option?: string;
}

function getPrefsDir(overrideDir?: string): string {
  if (overrideDir) return overrideDir;
  if (process.env.GANT_AGENT_TEST_PREFS_DIR) return process.env.GANT_AGENT_TEST_PREFS_DIR;
  const cwd = process.cwd();
  const localDir = path.join(cwd, '.gant-agent');
  if (fs.existsSync(localDir)) return localDir;
  return path.join(os.homedir(), '.gant-agent');
}

function getPrefsFile(overrideDir?: string): string {
  return path.join(getPrefsDir(overrideDir), 'question-preferences.json');
}

export async function getPreference(
  questionId: string,
  isOneWay: boolean,
  overrideDir?: string,
): Promise<PreferenceResult> {
  if (isOneWay) {
    return { action: 'ASK_NORMALLY' };
  }

  const file = getPrefsFile(overrideDir);
  if (!(await fs.pathExists(file))) {
    return { action: 'ASK_NORMALLY' };
  }

  const prefs = await fs.readJson(file);
  const value = prefs[questionId];
  if (typeof value === 'string') {
    return { action: 'AUTO_DECIDE', option: value };
  }

  return { action: 'ASK_NORMALLY' };
}

export async function setPreference(
  questionId: string,
  option: string,
  overrideDir?: string,
): Promise<void> {
  const file = getPrefsFile(overrideDir);
  await fs.ensureDir(path.dirname(file));
  const prefs = (await fs.pathExists(file)) ? await fs.readJson(file) : {};
  prefs[questionId] = option;
  await fs.writeJson(file, prefs, { spaces: 2 });
}

export async function listPreferences(overrideDir?: string): Promise<Record<string, string>> {
  const file = getPrefsFile(overrideDir);
  if (!(await fs.pathExists(file))) return {};
  return fs.readJson(file);
}
