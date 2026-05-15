import { CheckDefinition } from '../types.js';
import { systemChecks } from './system.js';
import { configChecks } from './config.js';
import { toolChecks } from './tools.js';
import { skillChecks } from './skills.js';

export function getAllCheckDefinitions(): CheckDefinition[] {
  return [
    ...systemChecks,
    ...configChecks,
    ...toolChecks,
    ...skillChecks,
  ];
}
