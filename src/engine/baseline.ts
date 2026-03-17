import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { BaselineSchema, type Baseline } from '../types/index.js';
import type { EvalResult } from './runner.js';

const BASELINES_DIR = 'baselines';

/** Converts eval result into a baseline snapshot. */
function toBaseline(result: EvalResult): Baseline {
  return {
    prompt_name: result.promptName,
    prompt_version: result.promptVersion,
    created_at: new Date().toISOString(),
    model: result.model,
    metrics: {
      accuracy: result.metrics.accuracy,
      avg_latency_ms: result.metrics.avgLatencyMs,
      total_tokens: result.metrics.totalTokens,
    },
    per_case: result.cases.map((c) => ({
      case_id: c.caseId,
      passed: c.passed,
      latency_ms: c.latencyMs,
      tokens: c.tokens,
    })),
  };
}

function baselinePath(promptName: string): string {
  return join(BASELINES_DIR, `${promptName}.json`);
}

/** Saves eval result as a baseline JSON file. */
export async function saveBaseline(result: EvalResult): Promise<string> {
  const baseline = toBaseline(result);
  const path = baselinePath(result.promptName);

  await mkdir(BASELINES_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(baseline, null, 2) + '\n');

  return path;
}

/** Loads a previously saved baseline for a prompt. Returns null if not found. */
export async function loadBaseline(promptName: string): Promise<Baseline | null> {
  try {
    const raw = await readFile(baselinePath(promptName), 'utf-8');
    return BaselineSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export type Verdict = 'pass' | 'fail' | 'warn';

export interface ComparisonResult {
  verdict: Verdict;
  baseline: Baseline;
  current: EvalResult['metrics'];
  deltas: {
    accuracy: number;
    avgLatencyMs: number;
    totalTokens: number;
  };
  regressions: string[];
}

/** Compares current eval metrics against saved baseline. Threshold = max allowed accuracy drop. */
export function compareWithBaseline(
  baseline: Baseline,
  current: EvalResult,
  threshold = 0.05,
): ComparisonResult {
  const deltas = {
    accuracy: current.metrics.accuracy - baseline.metrics.accuracy,
    avgLatencyMs: current.metrics.avgLatencyMs - baseline.metrics.avg_latency_ms,
    totalTokens: current.metrics.totalTokens - baseline.metrics.total_tokens,
  };

  const regressions: string[] = [];

  if (deltas.accuracy < -threshold) {
    regressions.push(
      `Accuracy dropped ${(Math.abs(deltas.accuracy) * 100).toFixed(1)}% (threshold: ${threshold * 100}%)`,
    );
  }

  const verdict: Verdict = regressions.length > 0 ? 'fail' : deltas.accuracy < 0 ? 'warn' : 'pass';

  return {
    verdict,
    baseline,
    current: current.metrics,
    deltas,
    regressions,
  };
}
