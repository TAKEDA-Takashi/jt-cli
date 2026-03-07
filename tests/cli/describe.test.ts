import { describe, expect, it } from 'vitest';
import { getToolDescription } from '../../src/cli/describe';
import { CLI_OPTIONS } from '../../src/cli/options';

describe('getToolDescription', () => {
  it('should return valid JSON', () => {
    const result = getToolDescription();
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should include options derived from shared CLI_OPTIONS', () => {
    const parsed = JSON.parse(getToolDescription());

    // CLI_OPTIONSに定義されている公開オプション（describeを除く）のflagがすべて含まれること
    const descriptionFlags = parsed.options.map((o: { flag: string }) => o.flag);

    for (const opt of CLI_OPTIONS) {
      if (opt.hidden) continue;
      expect(descriptionFlags).toContain(opt.flag);
    }
  });

  it('should not include hidden options in description', () => {
    const parsed = JSON.parse(getToolDescription());
    const descriptionFlags = parsed.options.map((o: { flag: string }) => o.flag);

    const hiddenOptions = CLI_OPTIONS.filter((o) => o.hidden);
    for (const opt of hiddenOptions) {
      expect(descriptionFlags).not.toContain(opt.flag);
    }
  });

  it('should include examples with command and description', () => {
    const parsed = JSON.parse(getToolDescription());

    expect(parsed.examples).toBeDefined();
    expect(parsed.examples.length).toBeGreaterThan(0);
    for (const example of parsed.examples) {
      expect(example).toHaveProperty('command');
      expect(example).toHaveProperty('description');
      expect(typeof example.command).toBe('string');
      expect(typeof example.description).toBe('string');
    }
  });

  it('should include queryLanguage information', () => {
    const parsed = JSON.parse(getToolDescription());

    expect(parsed.queryLanguage.name).toBe('JSONata');
    expect(parsed.queryLanguage.url).toBeDefined();
    expect(parsed.queryLanguage.features).toBeDefined();
    expect(parsed.queryLanguage.features.length).toBeGreaterThan(0);
  });

  it('should include defaultValue for options that have one', () => {
    const parsed = JSON.parse(getToolDescription());
    const outputFormatOpt = parsed.options.find(
      (o: { flag: string }) => o.flag === '-o, --output-format <format>',
    );
    expect(outputFormatOpt).toBeDefined();
    expect(outputFormatOpt.defaultValue).toBe('json');
  });

  it('should not include defaultValue key when option has no default', () => {
    const parsed = JSON.parse(getToolDescription());
    const compactOpt = parsed.options.find((o: { flag: string }) => o.flag === '-c, --compact');
    expect(compactOpt).toBeDefined();
    expect('defaultValue' in compactOpt).toBe(false);
  });

  it('should include notes about query-optional behavior', () => {
    const parsed = JSON.parse(getToolDescription());
    expect(parsed.notes).toBeDefined();
    expect(parsed.notes.length).toBeGreaterThan(0);
    // クエリ省略時の挙動が記載されていること
    const queryNote = parsed.notes.find((n: string) => n.toLowerCase().includes('query'));
    expect(queryNote).toBeDefined();
  });

  it('should have version matching package.json', () => {
    const parsed = JSON.parse(getToolDescription());
    const pkg = JSON.parse(
      require('node:fs').readFileSync(
        require('node:path').resolve(__dirname, '../../package.json'),
        'utf8',
      ),
    );

    expect(parsed.version).toBe(pkg.version);
  });
});
