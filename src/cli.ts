import 'dotenv/config';
import { Command } from 'commander';
import { resolve } from 'node:path';
import { loadPromptWithEval } from './loaders/prompt-loader.js';
import { createProvider } from './providers/index.js';
import { runEval, type EvalResult } from './engine/runner.js';
import { saveBaseline, loadBaseline, compareWithBaseline } from './engine/baseline.js';

const program = new Command();

program.name('prompt-ci').description('CI/CD quality gate for LLM prompts').version('0.1.0');

/** Shared helper: load prompt, run eval, print results. */
async function executeEval(promptFile: string): Promise<EvalResult> {
  const promptPath = resolve(promptFile);
  const { prompt, evalSuite } = await loadPromptWithEval(promptPath);

  console.log(`Prompt: ${prompt.name} v${prompt.version}`);
  console.log(`Model:  ${prompt.model.provider}/${prompt.model.name}`);
  console.log(`Suite:  ${evalSuite.name} (${evalSuite.cases.length} cases)\n`);

  const provider = createProvider(prompt);
  const result = await runEval(prompt, evalSuite, provider);

  for (const c of result.cases) {
    const icon = c.passed ? '✓' : '✗';
    console.log(`${icon} ${c.caseId} (${c.latencyMs}ms, ${c.tokens} tokens)`);
    for (const a of c.assertions) {
      const aIcon = a.passed ? '  ✓' : '  ✗';
      console.log(`${aIcon} ${a.detail}`);
    }
  }

  console.log('\n--- Metrics ---');
  console.log(`Accuracy:     ${(result.metrics.accuracy * 100).toFixed(1)}%`);
  console.log(`Avg latency:  ${result.metrics.avgLatencyMs}ms`);
  console.log(`Total tokens: ${result.metrics.totalTokens}`);

  return result;
}

// --- run command ---
program
  .command('run')
  .description('Run eval suite for a prompt file')
  .argument('<prompt-file>', 'Path to the prompt YAML file')
  .option('--dry-run', 'Load and validate files without calling LLM')
  .action(async (promptFile: string, opts: { dryRun?: boolean }) => {
    if (opts.dryRun) {
      const promptPath = resolve(promptFile);
      const { prompt, evalSuite } = await loadPromptWithEval(promptPath);
      console.log(`Prompt: ${prompt.name} v${prompt.version}`);
      console.log(`Model:  ${prompt.model.provider}/${prompt.model.name}`);
      console.log(`Suite:  ${evalSuite.name} (${evalSuite.cases.length} cases)\n`);
      console.log('Dry run — skipping LLM calls');
      return;
    }
    await executeEval(promptFile);
  });

// --- baseline save ---
program
  .command('baseline:save')
  .description('Run eval and save results as the baseline')
  .argument('<prompt-file>', 'Path to the prompt YAML file')
  .action(async (promptFile: string) => {
    const result = await executeEval(promptFile);
    const path = await saveBaseline(result);
    console.log(`\nBaseline saved: ${path}`);
  });

// --- baseline compare ---
program
  .command('baseline:compare')
  .description('Run eval and compare against saved baseline')
  .argument('<prompt-file>', 'Path to the prompt YAML file')
  .option('--threshold <number>', 'Max allowed accuracy drop (0-1)', '0.05')
  .action(async (promptFile: string, opts: { threshold: string }) => {
    const result = await executeEval(promptFile);
    const baseline = await loadBaseline(result.promptName);

    if (!baseline) {
      console.log('\nNo baseline found. Run `baseline:save` first.');
      process.exit(1);
    }

    const threshold = parseFloat(opts.threshold);
    const comparison = compareWithBaseline(baseline, result, threshold);

    console.log('\n--- Comparison ---');
    console.log(`Baseline version: ${baseline.prompt_version} (${baseline.created_at})`);

    const sign = (n: number) => (n >= 0 ? '+' : '');
    console.log(
      `Accuracy:  ${sign(comparison.deltas.accuracy)}${(comparison.deltas.accuracy * 100).toFixed(1)}%`,
    );
    console.log(
      `Latency:   ${sign(comparison.deltas.avgLatencyMs)}${comparison.deltas.avgLatencyMs}ms`,
    );
    console.log(
      `Tokens:    ${sign(comparison.deltas.totalTokens)}${comparison.deltas.totalTokens}`,
    );

    if (comparison.regressions.length > 0) {
      console.log('\nRegressions:');
      for (const r of comparison.regressions) {
        console.log(`  ✗ ${r}`);
      }
    }

    const verdictIcon = { pass: '✓ PASS', warn: '⚠ WARN', fail: '✗ FAIL' };
    console.log(`\nVerdict: ${verdictIcon[comparison.verdict]}`);

    if (comparison.verdict === 'fail') {
      process.exit(1);
    }
  });

await program.parseAsync();
