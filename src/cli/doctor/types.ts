export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

export interface CheckIssue {
  title: string;
  description: string;
  severity: 'info' | 'warn' | 'error';
}

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  issues: CheckIssue[];
  duration: number;
}

export interface CheckDefinition {
  name: string;
  category: 'system' | 'config' | 'tools' | 'skills';
  check: () => Promise<CheckResult> | CheckResult;
}

export interface DoctorSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  duration: number;
}

export interface DoctorResult {
  results: CheckResult[];
  summary: DoctorSummary;
  exitCode: number;
}

export interface DoctorOptions {
  mode?: 'default' | 'status' | 'verbose' | 'json';
}
