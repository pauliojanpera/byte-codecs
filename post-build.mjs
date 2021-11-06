// @ts-nocheck
import { join, basename } from 'path';
import fsextra from 'fs-extra';
const { lstatSync, copySync } = fsextra;

const __dirname = process.cwd();
const log = console.log; // () => {}; // console.log;

(async () => {
	for (const [src, dst] of ['../../LICENSE', 'assets', 'package.json'].map(fn => [
		join(__dirname, fn),
		join(__dirname, 'dist', lstatSync(fn).isDirectory() ? '' : basename(fn)),
	])) {
		log(`Copying ${src} to ${dst}`);
		log((copySync(src, dst, { overwrite: true }) || {}).message || 'Done.');
	}
})();
