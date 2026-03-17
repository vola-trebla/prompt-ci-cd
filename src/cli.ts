import 'dotenv/config';
import { Command } from 'commander';
import { resolve } from 'node:path';
import { loadPromptWithEval } from './loaders/prompt-loader.js';
import { createProvider } from './providers/index.js';
import { runEval } from './engine/runner.js';

const program = new Command();

program.name('prompt-ci').description('CI/CD quality gate for LLM prompts').version('0.1.0');

program
  .command('run')
  .description('Run eval suite for a prompt file')
  .argument('<prompt-file>', 'Path to the prompt YAML file')
  .option('--dry-run', 'Load and validate files without calling LLM')
  .action(async (promptFile: string, opts: { dryRun?: boolean }) => {
    const promptPath = resolve(promptFile);
    const { prompt, evalSuite } = await loadPromptWithEval(promptPath);

    console.log(`Prompt: ${prompt.name} v${prompt.version}`);
    console.log(`Model:  ${prompt.model.provider}/${prompt.model.name}`);
    console.log(`Suite:  ${evalSuite.name} (${evalSuite.cases.length} cases)\n`);

    if (opts.dryRun) {
      console.log('Dry run — skipping LLM calls');
      return;
    }

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
    console.log(`Accuracy:    ${(result.metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`Avg latency: ${result.metrics.avgLatencyMs}ms`);
    console.log(`Total tokens: ${result.metrics.totalTokens}`);
  });

await program.parseAsync();
