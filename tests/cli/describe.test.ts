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
});
