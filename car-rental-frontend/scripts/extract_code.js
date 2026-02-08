import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root
const projectRoot = path.resolve(__dirname, '..');
const outputFile = path.join(__dirname, 'project_files_list.txt');

// Folders to skip
const skipFolders = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.vscode',
  'uploads',
]);

// Files to skip
const skipFiles = new Set([
  'package-lock.json',
  'yarn.lock',
  '.env',
  '.DS_Store',
]);

function listFiles(folderPath) {
  const entries = fs.readdirSync(folderPath);

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (skipFolders.has(entry)) continue;
      listFiles(fullPath);
    } else {
      if (skipFiles.has(entry)) continue;

      // Write file name (relative path for clarity)
      const relativePath = path.relative(projectRoot, fullPath);
      fs.appendFileSync(outputFile, `${relativePath}\n`, 'utf-8');
    }
  }
}

// Clear output file
fs.writeFileSync(outputFile, '', 'utf-8');

// Start traversal
listFiles(projectRoot);

console.log(`✅ File names extracted`);
console.log(`📄 Output file: ${outputFile}`);
