// b66: the offline cache (sw.js) must list exactly what the game loads. cache.addAll() fails as a whole when one file
// is missing, and then the web game never works offline (b65 still listed story.js, bosslevel.js and tyrantlevel.js).
// usage: node tools/sw-files-test.js
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(R, 'sw.js'), 'utf8'), html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const files = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
const missing = files.filter((f) => !fs.existsSync(path.join(R, f)));
const scripts = [...html.matchAll(/<script[^>]+src="([^"?]+)/g)].map((m) => m[1]);
const uncached = scripts.filter((s) => !files.includes(s));
console.log({ listed: files.length, missing, uncached });
const pass = !missing.length && !uncached.length;
console.log(pass ? 'SW FILES TEST PASSED' : 'SW FILES TEST FAILED');
process.exit(pass ? 0 : 1);
