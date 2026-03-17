/** Replaces {{variable}} placeholders in a template string with values from the variables map. */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in variables)) {
      throw new Error(`Missing template variable: {{${key}}}`);
    }
    return variables[key];
  });
}
