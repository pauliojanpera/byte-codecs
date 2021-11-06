// @ts-nocheck
import path from 'path';
import fs from 'fs-extra';

const __dirname = process.cwd();
const log = console.log; // () => {}; // console.log;

(async () => {
	for (const [src, dst] of ['.static', 'package.json'].map(fn => [
		path.join(__dirname, fn),
		path.join(__dirname, '.dist', fs.lstatSync(fn).isDirectory() ? '' : fn),
	])) {
		log(`Copying ${src} to ${dst}`);
		log((fs.copySync(src, dst, { overwrite: true }) || {}).message || 'Done.');
	}
})();
