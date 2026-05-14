import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { Skill } from '../models/config.js';

const SCAN_DEPTH_LIMIT = 5;

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

export async function detectSkills(
  rootPath: string,
  sourceName: string,
  subPath?: string
): Promise<Skill[]> {
  const searchRoot = subPath ? join(rootPath, subPath) : rootPath;
  const skills: Skill[] = [];

  const rootSkillMd = join(searchRoot, 'SKILL.md');
  try {
    await stat(rootSkillMd);
    const { name, warnings, valid } = await parseSkillMd(rootSkillMd);
    for (const w of warnings) {
      console.warn(`  ⚠ ${sourceName}: ${w}`);
    }
    if (!valid) return skills;
    const skillName = name || sourceName;
    skills.push({
      name: skillName,
      path: relative(rootPath, searchRoot),
      source: sourceName,
    });
    return skills;
  } catch {
    void 0;
  }

  const skillsDir = join(searchRoot, 'skills');
  try {
    const s = await stat(skillsDir);
    if (s.isDirectory()) {
      const entries = await readdir(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillPath = join(skillsDir, entry.name);
        const skillMd = join(skillPath, 'SKILL.md');

        try {
          await stat(skillMd);
          const { name, warnings, valid } = await parseSkillMd(skillMd);
          for (const w of warnings) {
            console.warn(`  ⚠ ${sourceName}/${entry.name}: ${w}`);
          }
          if (!valid) continue;
          const skillName = name || entry.name;
          skills.push({
            name: skillName,
            path: relative(rootPath, skillPath),
            source: sourceName,
          });
        } catch {
          void 0;
        }
      }
      return skills;
    }
  } catch {
    void 0;
  }

  await walkDirectory(searchRoot, rootPath, sourceName, skills);
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
      await stat(skillMd);
      const { name, warnings, valid } = await parseSkillMd(skillMd);
      for (const w of warnings) {
        console.warn(`  ⚠ ${sourceName}/${entry.name}: ${w}`);
      }
      if (!valid) continue;
      const skillName = name || entry.name;
      skills.push({
        name: skillName,
        path: relative(rootPath, subDir),
        source: sourceName,
      });
    } catch {
      await walkDirectory(subDir, rootPath, sourceName, skills, depth + 1);
    }
  }
}

interface SkillMeta {
  name: string | null;
  warnings: string[];
  valid: boolean;
}

async function parseSkillMd(skillMdPath: string): Promise<SkillMeta> {
  const warnings: string[] = [];

  try {
    const content = await readFile(skillMdPath, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);

    if (match) {
      const frontmatter = match[1];

      const nameMatch = frontmatter.match(/name:\s*(.+)/);
      if (nameMatch) {
        const rawName = nameMatch[1].trim();

        if (/^["']/.test(rawName) && /["']$/.test(rawName)) {
          warnings.push(`SKILL.md frontmatter 中的 name 值被引号包围（"${rawName}"），建议去除引号以规范格式`);
          return { name: rawName, warnings, valid: false };
        }

        if (rawName === '') {
          warnings.push('SKILL.md frontmatter 中的 name 值为空');
          return { name: rawName, warnings, valid: false };
        }

        return { name: rawName, warnings, valid: true };
      } else {
        warnings.push('SKILL.md frontmatter 缺少 name 字段');
        return { name: null, warnings, valid: false };
      }
    } else {
      warnings.push('SKILL.md 缺少 frontmatter 块（---），建议添加 name 和 description 字段');
    }

    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) {
      return { name: titleMatch[1].trim(), warnings, valid: true };
    }

    if (warnings.length === 0) {
      warnings.push('SKILL.md 无法解析名称');
    }

    return { name: null, warnings, valid: false };
  } catch {
    return { name: null, warnings, valid: false };
  }
}
