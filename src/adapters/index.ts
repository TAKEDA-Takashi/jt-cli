// Interfaces
export type {
  CliContext,
  EnvironmentAdapter,
  FileSystemAdapter,
  InputAdapter,
  OutputAdapter,
} from './interfaces';

// Re-export types from types module for convenience
export type { CliOptions, InputFormat, OutputFormat } from '../types';

// Production adapters
export {
  NodeEnvironmentAdapter,
  NodeFileSystemAdapter,
  NodeInputAdapter,
  NodeOutputAdapter,
  createProductionContext,
} from './node-adapters';

// Test/Mock adapters
export {
  MockEnvironmentAdapter,
  MockFileSystemAdapter,
  MockInputAdapter,
  MockOutputAdapter,
  createMockContext,
  createMockContextWithData,
} from './mock-adapters';
