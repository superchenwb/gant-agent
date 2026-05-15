import { CheckDefinition, CheckResult, DoctorResult, DoctorSummary } from './types.js';
import { getAllCheckDefinitions } from './checks/index.js';

const DOCTOR_TIMEOUT_MS = 30_000;

class DoctorTimeoutError extends Error {
  constructor() {
    super('Doctor 诊断超时');
    this.name = 'DoctorTimeoutError';
  }
}

export async function runCheck(check: CheckDefinition): Promise<CheckResult> {
  const start = performance.now();
  try {
    const result = await check.check();
    result.duration = Math.round(performance.now() - start);
    return result;
  } catch (err) {
    return {
      name: check.name,
      status: 'fail',
      message: err instanceof Error ? err.message : '未知错误',
      issues: [{ title: check.name, description: String(err), severity: 'error' }],
      duration: Math.round(performance.now() - start),
    };
  }
}

export function calculateSummary(results: CheckResult[], duration: number): DoctorSummary {
  return {
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    warnings: results.filter((r) => r.status === 'warn').length,
    skipped: results.filter((r) => r.status === 'skip').length,
    duration: Math.round(duration),
  };
}

export function determineExitCode(results: CheckResult[]): number {
  return results.some((r) => r.status === 'fail') ? 1 : 0;
}

export async function runDoctor(): Promise<DoctorResult> {
  const start = performance.now();
  const allChecks = getAllCheckDefinitions();

  const checksPromise = Promise.all(allChecks.map(runCheck));

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DoctorTimeoutError()), DOCTOR_TIMEOUT_MS);
  });

  try {
    const results = await Promise.race([checksPromise, timeoutPromise]);
    clearTimeout(timer);

    const duration = performance.now() - start;
    const summary = calculateSummary(results, duration);
    const exitCode = determineExitCode(results);

    return { results, summary, exitCode };
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DoctorTimeoutError) {
      return {
        results: [{
          name: '超时',
          status: 'fail',
          message: 'Doctor 诊断超时（30秒）',
          issues: [{ title: '超时', description: '检查未在30秒内完成，可能有子进程挂起', severity: 'error' }],
          duration: DOCTOR_TIMEOUT_MS,
        }],
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          warnings: 0,
          skipped: 0,
          duration: DOCTOR_TIMEOUT_MS,
        },
        exitCode: 1,
      };
    }
    throw error;
  }
}
