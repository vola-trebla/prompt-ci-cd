import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { type ZodType, ZodError } from 'zod';

/** Loads a YAML file, parses it, and validates against a Zod schema. */
export async function loadYaml<T>(filePath: string, schema: ZodType<T>): Promise<T> {
  const raw = await readFile(filePath, 'utf-8');
  const data: unknown = parse(raw);

  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Validation failed for ${filePath}:\n${issues}`, { cause: err });
    }
    throw err;
  }
}
