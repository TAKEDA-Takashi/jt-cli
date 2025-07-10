import yaml from 'js-yaml';
import { JtError, ErrorCode } from '../../errors';

export function parseYaml(input: string): unknown {
  try {
    // js-yaml returns null for empty input, which is what we want
    const result = yaml.load(input);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Extract line and column information if available
    let detail = errorMessage;
    if (error instanceof yaml.YAMLException && error.mark) {
      const { line, column } = error.mark;
      detail = `${errorMessage} (line ${line + 1}, column ${column + 1})`;
    }
    
    throw new JtError(
      ErrorCode.INVALID_INPUT,
      'Invalid YAML input',
      detail,
      'Check indentation and syntax',
    );
  }
}