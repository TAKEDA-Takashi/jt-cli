// Interfaces

// Re-export types from types module for convenience
export type { CliOptions, InputFormat, OutputFormat } from '../types';
export type {
  CliContext,
  EnvironmentAdapter,
  FileSystemAdapter,
  InputAdapter,
  OutputAdapter,
} from './interfaces';
// Test/Mock adapters
export {
  createMockContext,
  createMockContextWithData,
  MockEnvironmentAdapter,
  MockFileSystemAdapter,
  MockInputAdapter,
  MockOutputAdapter,
} from './mock-adapters';
// Production adapters
export {
  createProductionContext,
  NodeEnvironmentAdapter,
  NodeFileSystemAdapter,
  NodeInputAdapter,
  NodeOutputAdapter,
} from './node-adapters';
