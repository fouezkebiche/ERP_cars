import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up one level to the project root
const sourceFolder = path.resolve(__dirname, '..');
const outputFile = path.join(__dirname, 'project_code_output.txt');

// File types you want to extract
const extensions = [
  '.js', '.jsx', '.ts', '.tsx',
  '.json', '.html', '.css', '.scss',
];

// Folders to skip (important for MERN apps)
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

function concatenateFiles(folderPath, depth = 0) {
  const files = fs.readdirSync(folderPath);
  let fileContent = '';
  let folderContent = '';

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (skipFolders.has(file)) continue;

      const subContent = concatenateFiles(filePath, depth + 1);
      if (subContent?.trim()) {
        folderContent += `\n\n// ${'  '.repeat(depth)}[Folder] ${file}\n${subContent}\n`;
      }
    } else {
      if (skipFiles.has(file)) continue;

      for (const ext of extensions) {
        if (file.endsWith(ext)) {
          const fileData = fs.readFileSync(filePath, 'utf-8');
          fileContent += `\n\n// ${filePath}\n${fileData}`;
          break;
        }
      }
    }
  }

  return folderContent + fileContent;
}

// Clear output
fs.writeFileSync(outputFile, '', 'utf-8');
const allContent = concatenateFiles(sourceFolder);
fs.appendFileSync(outputFile, allContent, 'utf-8');

console.log(`✅ Code extracted to: ${outputFile}`);
