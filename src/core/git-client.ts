import simpleGit from 'simple-git';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface GitCloneOptions {
  repo: string;
  targetPath: string;
  branch?: string;
  depth?: number;
}

export async function cloneRepo(options: GitCloneOptions): Promise<void> {
  const { repo, targetPath, branch, depth = 1 } = options;

  await mkdir(dirname(targetPath), { recursive: true });

  const git = simpleGit();
  const cloneArgs: string[] = ['--filter=blob:none'];

  if (depth > 0) {
    cloneArgs.push(`--depth=${depth}`);
  }

  if (branch) {
    cloneArgs.push('--branch', branch);
  }

  try {
    await git.clone(repo, targetPath, cloneArgs);
  } catch (error) {
    throw enhanceGitError(error, `克隆仓库失败: ${repo}`);
  }
}

export async function pullRepo(targetPath: string): Promise<void> {
  const git = simpleGit(targetPath);
  await git.pull('--ff-only');
}

export async function fetchRepo(targetPath: string): Promise<void> {
  const git = simpleGit(targetPath);
  try {
    await git.fetch();
  } catch (error) {
    throw enhanceGitError(error, `获取更新失败: ${targetPath}`);
  }
}

export async function getCurrentCommit(targetPath: string): Promise<string> {
  const git = simpleGit(targetPath);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash || '';
}

export async function checkoutCommit(targetPath: string, commit: string): Promise<void> {
  const git = simpleGit(targetPath);
  await git.checkout(commit);
}

export async function resolveRemoteCommit(
  repo: string,
  version: string
): Promise<string> {
  if (version.match(/^[a-f0-9]{40}$/)) {
    return version;
  }

  const git = simpleGit();

  try {
    const headsResult = await git.listRemote([
      '--heads',
      repo,
      `refs/heads/${version}`,
    ]);

    if (headsResult) {
      const match = headsResult.match(/^(\w+)/);
      if (match) return match[1];
    }

    const tagsResult = await git.listRemote([
      '--tags',
      repo,
      `refs/tags/${version}`,
    ]);

    if (tagsResult) {
      const match = tagsResult.match(/^(\w+)/);
      if (match) return match[1];
    }

    throw new Error(`无法解析版本: ${version}。请检查分支或标签名称是否正确。`);
  } catch (error) {
    throw enhanceGitError(error, `解析版本失败: ${repo}@${version}`);
  }
}

export async function isGitRepo(targetPath: string): Promise<boolean> {
  if (!existsSync(targetPath)) return false;
  try {
    const git = simpleGit(targetPath);
    await git.status();
    return true;
  } catch {
    return false;
  }
}

function enhanceGitError(error: unknown, context: string): Error {
  const originalMessage = error instanceof Error ? error.message : String(error);
  let suggestion = '';

  if (originalMessage.includes('Could not resolve hostname') || originalMessage.includes('Unable to look up')) {
    suggestion = '网络连接失败，请检查网络或仓库地址是否正确';
  } else if (originalMessage.includes('Permission denied') || originalMessage.includes('publickey')) {
    suggestion = 'SSH 认证失败，请确认 SSH 密钥已配置并添加到仓库: ssh-keygen -t ed25519 -C "your-email"';
  } else if (originalMessage.includes('Repository not found') || originalMessage.includes('does not exist')) {
    suggestion = '仓库不存在或无权访问，请检查仓库地址和权限';
  } else if (originalMessage.includes('Could not resolve')) {
    suggestion = '无法解析仓库地址，请检查网络连接和仓库 URL';
  } else if (originalMessage.includes('Connection timed out')) {
    suggestion = '连接超时，请检查网络连接或稍后重试';
  }

  const fullMessage = suggestion
    ? `${context}\n原因: ${originalMessage}\n建议: ${suggestion}`
    : `${context}\n原因: ${originalMessage}`;

  return new Error(fullMessage);
}
