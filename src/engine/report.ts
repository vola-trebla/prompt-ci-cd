import type { ComparisonResult } from './baseline.js';
import type { EvalResult } from './runner.js';

/** Generates a markdown PR comment report from comparison results. */
export function generateReport(result: EvalResult, comparison: ComparisonResult): string {
  const sign = (n: number) => (n >= 0 ? '+' : '');
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const statusIcon = (delta: number) => (delta > 0 ? '✅' : delta < 0 ? '⚠️' : '➖');

  const verdictMap = { pass: '✅ PASS', warn: '⚠️ WARN', fail: '❌ FAIL' };

  const lines = [
    `## 🐸 Prompt CI Report: \`${result.promptName}\``,
    '',
    `**Model:** ${result.model.provider}/${result.model.name} | **Version:** ${result.promptVersion}`,
    '',
    '| Metric | Baseline | Current | Delta | Status |',
    '|--------|----------|---------|-------|--------|',
    `| Accuracy | ${pct(comparison.baseline.metrics.accuracy)} | ${pct(result.metrics.accuracy)} | ${sign(comparison.deltas.accuracy)}${pct(comparison.deltas.accuracy)} | ${statusIcon(comparison.deltas.accuracy)} |`,
    `| Avg Latency | ${comparison.baseline.metrics.avg_latency_ms}ms | ${result.metrics.avgLatencyMs}ms | ${sign(comparison.deltas.avgLatencyMs)}${comparison.deltas.avgLatencyMs}ms | ➖ |`,
    `| Total Tokens | ${comparison.baseline.metrics.total_tokens} | ${result.metrics.totalTokens} | ${sign(comparison.deltas.totalTokens)}${comparison.deltas.totalTokens} | ➖ |`,
    '',
  ];

  if (comparison.regressions.length > 0) {
    lines.push('### Regressions');
    for (const r of comparison.regressions) {
      lines.push(`- ❌ ${r}`);
    }
    lines.push('');
  }

  lines.push(`**Verdict: ${verdictMap[comparison.verdict]}**`);

  // Per-case details in collapsible section
  lines.push('', '<details>', '<summary>Per-case details</summary>', '');
  for (const c of result.cases) {
    const icon = c.passed ? '✅' : '❌';
    lines.push(`#### ${icon} ${c.caseId} (${c.latencyMs}ms, ${c.tokens} tokens)`);
    for (const a of c.assertions) {
      const aIcon = a.passed ? '✅' : '❌';
      lines.push(`- ${aIcon} ${a.detail}`);
    }
    lines.push('');
  }
  lines.push('</details>');

  return lines.join('\n');
}
