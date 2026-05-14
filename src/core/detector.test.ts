import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { detectSkills } from './detector.js';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

function createTempDir(): string {
  const dir = join(tmpdir(), `gant-test-${randomBytes(4).toString('hex')}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('detector', () => {
  describe('detectSkills', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = createTempDir();
    });

    afterEach(() => {
      cleanup(tempDir);
    });

    it('should detect skill at root level', async () => {
      writeFileSync(join(tempDir, 'SKILL.md'), '# Root Skill\n', 'utf-8');

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Root Skill');
      expect(skills[0].path).toBe('');
      expect(skills[0].source).toBe('test-source');
    });

    it('should detect skills in skills/ directory', async () => {
      const skillsDir = join(tempDir, 'skills');
      mkdirSync(skillsDir, { recursive: true });
      mkdirSync(join(skillsDir, 'skill-a'), { recursive: true });
      mkdirSync(join(skillsDir, 'skill-b'), { recursive: true });

      writeFileSync(join(skillsDir, 'skill-a', 'SKILL.md'), '# Skill A\n', 'utf-8');
      writeFileSync(join(skillsDir, 'skill-b', 'SKILL.md'), '# Skill B\n', 'utf-8');

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills).toHaveLength(2);
      expect(skills.map(s => s.name).sort()).toEqual(['Skill A', 'Skill B']);
    });

    it('should extract skill name from frontmatter', async () => {
      writeFileSync(
        join(tempDir, 'SKILL.md'),
        '---\nname: Custom Skill Name\n---\n\n# Some Title\n',
        'utf-8'
      );

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Custom Skill Name');
    });

    it('should skip skill when no name or title found', async () => {
      const skillsDir = join(tempDir, 'skills');
      mkdirSync(skillsDir, { recursive: true });
      mkdirSync(join(skillsDir, 'no-name'), { recursive: true });

      writeFileSync(
        join(skillsDir, 'no-name', 'SKILL.md'),
        'No title here\n',
        'utf-8'
      );

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills).toHaveLength(0);
    });

    it('should search subPath when provided', async () => {
      const subDir = join(tempDir, 'frontend', 'react');
      mkdirSync(subDir, { recursive: true });

      writeFileSync(join(subDir, 'SKILL.md'), '# React Hooks\n', 'utf-8');

      const skills = await detectSkills(tempDir, 'test-source', 'frontend/react');

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('React Hooks');
      expect(skills[0].path).toBe('frontend/react');
    });

    it('should walk directory tree up to depth 5', async () => {
      const deepDir = join(tempDir, 'a', 'b', 'c', 'd', 'e');
      mkdirSync(deepDir, { recursive: true });

      writeFileSync(join(deepDir, 'SKILL.md'), '# Deep Skill\n', 'utf-8');

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Deep Skill');
    });

    it('should not walk deeper than depth 5', async () => {
      const tooDeep = join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f');
      mkdirSync(tooDeep, { recursive: true });

      writeFileSync(join(tooDeep, 'SKILL.md'), '# Too Deep\n', 'utf-8');

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills).toHaveLength(0);
    });

    it('should return empty array when no skills found', async () => {
      const skills = await detectSkills(tempDir, 'test-source');
      expect(skills).toEqual([]);
    });

    it('should prefer frontmatter name over markdown title', async () => {
      writeFileSync(
        join(tempDir, 'SKILL.md'),
        '---\nname: Frontmatter Name\n---\n\n# Markdown Title\n',
        'utf-8'
      );

      const skills = await detectSkills(tempDir, 'test-source');

      expect(skills[0].name).toBe('Frontmatter Name');
    });
  });
});
