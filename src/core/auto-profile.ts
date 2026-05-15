import type { Skill } from '../models/config.js';

export interface AutoProfile {
  name: string;
  description: string;
  sourceSkills: Map<string, string[]>;
}

export function generateAutoProfiles(
  allSkills: Array<{ source: string; skill: Skill }>
): AutoProfile[] {
  const profiles: AutoProfile[] = [];

  const sourceSkills = new Map<string, Skill[]>();
  for (const { source, skill } of allSkills) {
    if (!sourceSkills.has(source)) sourceSkills.set(source, []);
    sourceSkills.get(source)!.push(skill);
  }

  const categoryMap = new Map<string, Map<string, string[]>>();

  for (const [source, skills] of sourceSkills) {
    for (const skill of skills) {
      const categories = detectCategories(skill);
      for (const cat of categories) {
        if (!categoryMap.has(cat)) categoryMap.set(cat, new Map());
        if (!categoryMap.get(cat)!.has(source)) categoryMap.get(cat)!.set(source, []);
        categoryMap.get(cat)!.get(source)!.push(skill.name);
      }
    }
  }

  for (const [cat, sourceMap] of categoryMap) {
    const totalSkills = Array.from(sourceMap.values()).flat().length;
    if (totalSkills < 2) continue;

    profiles.push({
      name: cat,
      description: `自动检测: ${cat}相关 Skills（${totalSkills} 个）`,
      sourceSkills: sourceMap,
    });
  }

  const allSourceSkills = new Map<string, string[]>();
  for (const [source, skills] of sourceSkills) {
    allSourceSkills.set(source, skills.map(s => s.name));
  }
  profiles.push({
    name: 'all',
    description: `自动检测: 全部 Skills`,
    sourceSkills: allSourceSkills,
  });

  return sortProfiles(profiles);
}

function detectCategories(skill: Skill): string[] {
  const categories = new Set<string>();
  const path = skill.path.toLowerCase();

  if (path.includes('react') || path.includes('reactui') || path.includes('tsx')) {
    categories.add('react');
    categories.add('frontend');
  }
  if (path.includes('vue') || path.includes('.vue')) {
    categories.add('vue');
    categories.add('frontend');
  }
  if (path.includes('前端') || path.includes('frontend')) {
    categories.add('frontend');
  }
  if (path.includes('后端') || path.includes('backend') || path.includes('server')) {
    categories.add('backend');
  }
  if (path.includes('数据库') || path.includes('db') || path.includes('migration')) {
    categories.add('database');
  }
  if (path.includes('测试') || path.includes('test')) {
    categories.add('testing');
  }
  if (path.includes('文档') || path.includes('doc')) {
    categories.add('documentation');
  }

  if (skill.tags) {
    for (const tag of skill.tags) {
      const t = tag.toLowerCase();
      categories.add(t);
      if (t === 'frontend' || t === 'ui' || t === 'component') categories.add('frontend');
      if (t === 'backend' || t === 'api' || t === 'server') categories.add('backend');
      if (t === 'database' || t === 'db' || t === 'sql') categories.add('database');
      if (t === 'test' || t === 'testing') categories.add('testing');
      if (t === 'doc' || t === 'documentation') categories.add('documentation');
      if (t === 'bom' || t === 'yadea') categories.add('bom');
    }
  }

  if (skill.triggers) {
    for (const trigger of skill.triggers) {
      const t = trigger.toLowerCase();
      if (t.includes('bom')) categories.add('bom');
      if (t.includes('git')) categories.add('git');
      if (t.includes('代码') || t.includes('code')) categories.add('code-quality');
    }
  }

  const name = skill.name.toLowerCase();
  if (name.includes('button') || name.includes('input') || name.includes('selector')) {
    categories.add('ui-components');
    categories.add('frontend');
  }
  if (name.includes('page') || name.includes('detail') || name.includes('main')) {
    categories.add('page-development');
    categories.add('frontend');
  }
  if (name.includes('api') || name.includes('service')) {
    categories.add('api');
  }
  if (name.includes('sql') || name.includes('db')) {
    categories.add('database');
  }

  if (skill.source.toLowerCase().includes('yadea')) {
    categories.add('yadea');
  }

  return Array.from(categories);
}

function sortProfiles(profiles: AutoProfile[]): AutoProfile[] {
  return profiles.sort((a, b) => {
    const countA = Array.from(a.sourceSkills.values()).flat().length;
    const countB = Array.from(b.sourceSkills.values()).flat().length;
    return countB - countA;
  });
}
