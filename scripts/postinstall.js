#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, homedir } = require('node:path');

const MIN_NODE_VERSION = '18.0.0';
const MIN_BUN_VERSION = '1.0.0';

function parseVersion(version) {
  return version
    .replace(/^v/, '')
    .split('-')[0]
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersions(current, minimum) {
  const currentParts = parseVersion(current);
  const minimumParts = parseVersion(minimum);
  const length = Math.max(currentParts.length, minimumParts.length);

  for (let index = 0; index < length; index++) {
    const currentPart = currentParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;
    if (currentPart > minimumPart) return true;
    if (currentPart < minimumPart) return false;
  }

  return true;
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const ok = compareVersions(version, MIN_NODE_VERSION);
    return { ok, version };
  } catch {
    return { ok: false, version: null };
  }
}

function checkBunVersion() {
  try {
    const result = execSync('bun --version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const version = result.trim();
    const ok = compareVersions(version, MIN_BUN_VERSION);
    return { ok, version };
  } catch {
    return { ok: false, version: null };
  }
}

function detectAgents() {
  const agents = [];

  const candidates = [
    { name: 'OpenCode', command: 'opencode --version', configDir: '.opencode' },
    { name: 'Claude Code', command: 'claude --version', configDir: '.claude' },
    { name: 'Cursor', command: 'cursor --version', configDir: '.cursor' },
  ];

  for (const candidate of candidates) {
    try {
      execSync(candidate.command, {
        timeout: 3000,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      agents.push(candidate.name);
    } catch {
      continue;
    }
  }

  return agents;
}

function hasConfig() {
  const userConfig = join(homedir(), '.gant-agent', 'gant.yaml');
  if (existsSync(userConfig)) return true;

  const jsoncConfig = join(homedir(), '.gant-agent', 'gant.jsonc');
  if (existsSync(jsoncConfig)) return true;

  const jsonConfig = join(homedir(), '.gant-agent', 'gant.json');
  if (existsSync(jsonConfig)) return true;

  return false;
}

function main() {
  console.log('🚀 gant-agent postinstall check\n');

  const nodeCheck = checkNodeVersion();
  if (nodeCheck.version) {
    if (nodeCheck.ok) {
      console.log(`✓ Node.js ${nodeCheck.version}`);
    } else {
      console.log(`⚠ Node.js ${nodeCheck.version} (推荐 >= ${MIN_NODE_VERSION})`);
    }
  }

  const bunCheck = checkBunVersion();
  if (bunCheck.version) {
    if (bunCheck.ok) {
      console.log(`✓ Bun ${bunCheck.version}`);
    } else {
      console.log(`⚠ Bun ${bunCheck.version} (推荐 >= ${MIN_BUN_VERSION})`);
    }
  } else {
    console.log('ℹ Bun 未安装（可选，但推荐用于开发）');
  }

  const agents = detectAgents();
  if (agents.length > 0) {
    console.log(`✓ 检测到 Agent: ${agents.join(', ')}`);
  } else {
    console.log('ℹ 未检测到已安装的 AI Agent');
  }

  if (!hasConfig()) {
    console.log('');
    console.log('─────────────────────────────────');
    console.log('💡 首次安装？运行以下命令初始化：');
    console.log('');
    console.log('   gant init');
    console.log('');
    console.log('   # 或创建项目级配置');
    console.log('   gant init --local');
    console.log('─────────────────────────────────');
  } else {
    console.log('✓ 配置已存在');
  }

  console.log('');
}

main();
