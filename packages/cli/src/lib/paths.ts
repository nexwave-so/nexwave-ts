import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the package root directory
 * In bundled output: dist/bin -> dist -> packages/cli
 * In development: src/lib -> src -> packages/cli
 */
function getPackageRoot(): string {
  // Try to find package.json by going up from current location
  let current = __dirname;
  
  // In bundled output, we're in dist/bin, so go up 2 levels
  // In development, we're in src/lib, so go up 2 levels
  for (let i = 0; i < 5; i++) {
    const packageJsonPath = join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      return current;
    }
    current = join(current, '..');
  }
  
  // Fallback: assume we're in packages/cli
  return join(__dirname, '..', '..');
}

/**
 * Resolve a file path, handling template paths
 * If path starts with "templates/", resolve it relative to package root
 */
export function resolveFilePath(filePath: string): string {
  // If it's an absolute path, return as-is
  if (filePath.startsWith('/')) {
    return filePath;
  }
  
  // If it starts with "templates/", resolve relative to package root
  if (filePath.startsWith('templates/')) {
    const packageRoot = getPackageRoot();
    return join(packageRoot, filePath);
  }
  
  // Otherwise, return as-is (relative to current working directory)
  return filePath;
}

/**
 * Get the templates directory path
 */
export function getTemplatesDir(): string {
  const packageRoot = getPackageRoot();
  return join(packageRoot, 'templates');
}
