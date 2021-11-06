import { readdirSync } from 'fs';
import { join } from 'path';
import { default as jestProject } from './jest.config.base.js';

// @ts-ignore
const __dirname = new URL('.', import.meta.url).pathname;
const packagesDir = join(__dirname, 'packages');

export default {
	projects: readdirSync(packagesDir, { withFileTypes: true })
	.filter(dirent => dirent.isDirectory())
	.map(dirent => jestProject(join(packagesDir, dirent.name)))
};
