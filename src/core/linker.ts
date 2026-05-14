import { symlink, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Skill } from '../models/config.js';
import { PATHS, getProfilePath, getProfileSkillPath } from '../utils/paths.js';

export async function linkSkill(
  skill: Skill,
  cachePath: string,
  profileName: string
): Promise<string> {
  const sourceSkillPath = join(cachePath, skill.path);
  const targetPath = getProfileSkillPath(profileName, skill.name);

  await mkdir(PATHS.profiles, { recursive: true });
  await mkdir(getProfilePath(profileName), { recursive: true });

  if (existsSync(targetPath)) {
    await unlink(targetPath);
  }

  await symlink(sourceSkillPath, targetPath, 'dir');

  return targetPath;
}

export async function unlinkSkill(
  profileName: string,
  skillName: string
): Promise<void> {
  const targetPath = getProfileSkillPath(profileName, skillName);

  if (!existsSync(targetPath)) return;

  const lstat = await import('node:fs/promises').then(m => m.lstat);
  const stats = await lstat(targetPath);

  if (stats.isSymbolicLink()) {
    await unlink(targetPath);
  }
}

export async function cleanProfileLinks(profileName: string): Promise<void> {
  const profilePath = getProfilePath(profileName);

  if (!existsSync(profilePath)) return;

  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(profilePath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(profilePath, entry.name);
    if (entry.isSymbolicLink()) {
      await unlink(entryPath);
    }
  }
}
