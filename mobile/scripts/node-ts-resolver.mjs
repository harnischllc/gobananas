// Lets Node run the app's TypeScript modules directly (type stripping) even
// though they import each other without file extensions, which ES modules
// normally refuse. Used by `npm test`, `npm run fixtures` and `npm run stats`:
//
//   node --import ./scripts/node-ts-resolver.mjs <script>
//
// Only relative, extensionless specifiers from this project's own files are
// touched (`.ts`, then `.tsx`, `.mts`). Nothing is transpiled: Node
// strips types itself, so the lib files it reaches must use only erasable
// TypeScript (no enums, no parameter properties, `import type` for types)
// and no React Native imports.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXTENSIONS = ['.ts', '.tsx', '.mts'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(specifier);
    const parent = context.parentURL ?? '';
    // Only our own TypeScript. CommonJS packages in node_modules (jpeg-js)
    // require './lib/x' and must keep Node's normal resolution.
    const ours = parent.startsWith('file:') && !parent.includes('/node_modules/');
    if (relative && !hasExtension && ours) {
      const base = new URL(specifier, context.parentURL);
      for (const ext of EXTENSIONS) {
        const candidate = new URL(base.href + ext);
        if (existsSync(fileURLToPath(candidate))) {
          return nextResolve(candidate.href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
