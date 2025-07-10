import { exec } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { analyzeMetafile, build } from 'esbuild';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

async function buildCLI() {
  console.log('📦 Building CLI...');

  const result = await build({
    entryPoints: ['src/cli.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: 'dist/jt.js',
    banner: {
      js: '#!/usr/bin/env node',
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    metafile: true,
    // External dependencies that should not be bundled
    external: ['node:*', 'commander', 'jsonata', 'js-yaml', 'csv-stringify'],
    define: {
      __VERSION__: JSON.stringify(pkg.version),
      __DESCRIPTION__: JSON.stringify(pkg.description),
    },
  });

  if (process.argv.includes('--analyze')) {
    const text = await analyzeMetafile(result.metafile);
    console.log('\n📊 Bundle analysis:');
    console.log(text);
  }

  console.log('✅ CLI build complete');
}

async function buildLibrary() {
  console.log('📚 Building library...');

  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    outfile: 'dist/index.js',
    sourcemap: true,
    // External dependencies for library
    external: ['commander', 'jsonata', 'js-yaml', 'csv-stringify', 'node:*'],
    minify: process.env.NODE_ENV === 'production',
  });

  console.log('✅ Library build complete');
}

async function buildTypes() {
  console.log('🎯 Generating type definitions...');

  try {
    // Ensure dist directory exists
    mkdirSync('dist', { recursive: true });

    await execAsync('tsc -p tsconfig.build.json');
    console.log('✅ Type definitions generated');
  } catch (error) {
    console.error('❌ Type generation failed:', error.message);
    throw error;
  }
}

async function buildAll() {
  console.log('🔨 Building jt...\n');

  try {
    // Type check first
    console.log('📝 Type checking...');
    await execAsync('tsc --noEmit');
    console.log('✅ Type check passed\n');

    // Run builds in parallel
    await Promise.all([buildCLI(), buildLibrary(), buildTypes()]);

    console.log('\n✨ Build complete!');
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
if (process.argv.includes('--cli')) {
  buildCLI().catch(console.error);
} else if (process.argv.includes('--lib')) {
  buildLibrary().catch(console.error);
} else if (process.argv.includes('--types')) {
  buildTypes().catch(console.error);
} else {
  buildAll().catch(console.error);
}
