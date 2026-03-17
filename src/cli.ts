import { Command } from 'commander';
import { resolve } from 'node:path';
import { loadPromptWithEval } from './loaders/prompt-loader.js';

const program = new Command();

program.name('prompt-ci').description('CI/CD quality gate for LLM prompts').version('0.1.0');

program
  .command('run')
  .description('Run eval suite for a prompt file')
  .argument('<prompt-file>', 'Path to the prompt YAML file')
  .action(async (promptFile: string) => {
    const promptPath = resolve(promptFile);

    console.log(`Loading prompt: ${promptPath}`);

    try {
      const { prompt, evalSuite } = await loadPromptWithEval(promptPath);

      console.log(`\nPrompt: ${prompt.name} v${prompt.version}`);
      console.log(`Model: ${prompt.model.provider}/${prompt.model.name}`);
      console.log(`Eval suite: ${evalSuite.name} (${evalSuite.cases.length} test cases)`);
      console.log('\nTest cases:');
      for (const tc of evalSuite.cases) {
        console.log(`  - ${tc.id}: ${tc.assertions.length} assertions`);
      }

      console.log('\n✓ Files loaded and validated successfully');
      console.log('(eval runner coming in TASK-02)');
    } catch (err) {
      console.error(`\n✗ Error: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  });

await program.parseAsync();
