import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { Skill } from '../models/config.js';
import { cwd } from 'node:process';

const BUILTIN_SKILLS_DIR = join(__dirname, '..', '..', 'built-in-skills');

export interface ScopeResult {
  scope: string;
  path: string;
  skills: Skill[];
}

export interface DiscoveredSkills {
  skills: Skill[];
  scopes: ScopeResult[];
  conflicts: Array<{
    name: string;
    winner: string;
    losers: string[];
  }>;
}

const SCAN_DEPTH_LIMIT = 3;

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'target',
  '.idea',
  '.vscode',
  'coverage',
  '__tests__',
]);

function getScopePaths(): Array<{ scope: string; path: string }> {
  const scopes: Array<{ scope: string; path: string }> = [];

  const projectDir = cwd();
  const projectSkills = join(projectDir, '.gant', 'skills');
  if (existsSync(projectSkills)) {
    scopes.push({ scope: 'project', path: projectSkills });
  }

  const userSkills = join(homedir(), '.gant', 'skills');
  if (existsSync(userSkills)) {
    scopes.push({ scope: 'user', path: userSkills });
  }

  const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  const globalSkills = join(xdgConfigHome, 'gant', 'skills');
  if (existsSync(globalSkills)) {
    scopes.push({ scope: 'global', path: globalSkills });
  }

  if (existsSync(BUILTIN_SKILLS_DIR)) {
    scopes.push({ scope: 'builtin', path: BUILTIN_SKILLS_DIR });
  }

  return scopes;
}

export async function discoverLocalSkills(): Promise<DiscoveredSkills> {
  const scopePaths = getScopePaths();
  const scopes: ScopeResult[] = [];

  for (const { scope, path } of scopePaths) {
    const skills = await scanScope(path, scope);
    scopes.push({ scope, path, skills });
  }

  const { skills, conflicts } = mergeScopes(scopes);

  return { skills, scopes, conflicts };
}

async function scanScope(scopePath: string, sourceName: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  await walkDirectory(scopePath, scopePath, sourceName, skills, 0);
  return skills;
}

async function walkDirectory(
  dir: string,
  rootPath: string,
  sourceName: string,
  skills: Skill[],
  depth = 0
): Promise<void> {
  if (depth >= SCAN_DEPTH_LIMIT) return;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const subDir = join(dir, entry.name);
    const skillMd = join(subDir, 'SKILL.md');

    try {
      const s = await stat(skillMd);
      if (s.isFile()) {
        skills.push({
          name: entry.name,
          path: subDir,
          source: sourceName,
        });
      }
    } catch {
      await walkDirectory(subDir, rootPath, sourceName, skills, depth + 1);
    }
  }
}

function mergeScopes(scopes: ScopeResult[]): {
  skills: Skill[];
  conflicts: DiscoveredSkills['conflicts'];
} {
  const skillMap = new Map<string, Skill>();
  const conflicts: DiscoveredSkills['conflicts'] = [];

  for (const scope of scopes) {
    for (const skill of scope.skills) {
      const existing = skillMap.get(skill.name);
      if (existing) {
        const conflict = conflicts.find(c => c.name === skill.name);
        if (conflict) {
          conflict.losers.push(scope.scope);
        } else {
          conflicts.push({
            name: skill.name,
            winner: existing.source,
            losers: [scope.scope],
          });
        }
      } else {
        skillMap.set(skill.name, skill);
      }
    }
  }

  return {
    skills: Array.from(skillMap.values()),
    conflicts,
  };
}
