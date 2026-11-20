// Packs the shipped game (build/www, made by tools/build-dist.sh) into ONE html file: dist/Flippo.html.
// Double-click it and it opens in the browser — nothing to unzip, no other files needed.
// Scripts, styles, fonts and the icon are all inlined; the world board and gift codes still need internet.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'build', 'www');
const read = (p) => fs.readFileSync(path.join(WWW, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(WWW, p)).toString('base64');

let html = read('index.html');
// fonts: the @font-face urls become data: urls
const fonts = read('fonts/cairo.css').replace(/url\(([^)]+\.woff2)\)/g, (_, f) => 'url(data:font/woff2;base64,' + b64('fonts/' + f) + ')');
const swap = (re, by) => {
  if (!re.test(html)) throw new Error('not found in index.html: ' + re);
  html = html.replace(re, () => by);
};
swap(/<link rel="stylesheet" href="fonts\/cairo\.css">/, '<style>' + fonts + '</style>');
swap(/<link rel="stylesheet" href="css\/style\.css">/, '<style>' + read('css/style.css') + '</style>');
const icon = 'data:image/png;base64,' + b64('icons/icon-192.png');
swap(/<link rel="icon" href="icons\/icon-192\.png">/, '<link rel="icon" href="' + icon + '">');
swap(/<link rel="apple-touch-icon" href="icons\/icon-192\.png">/, '<link rel="apple-touch-icon" href="' + icon + '">');
swap(/<link rel="manifest" href="manifest\.webmanifest">\n?/, ''); // an installable web app needs a server; a single file doesn't
// every script inline, in the same order (a "</script" inside the code must not end the tag)
let n = 0;
html = html.replace(/<script src="(js\/[a-z0-9-]+\.js)"><\/script>/g, (_, src) => {
  n++;
  return '<script>' + read(src).replace(/<\/script/gi, '<\\/script') + '</script>';
});
if (!n || /<script src=/.test(html)) throw new Error('scripts were not all inlined');
// b46: the prologue film rides along inside the file (ui.js turns it back into a video)
const out = path.join(ROOT, 'dist', 'Flippo.html');
fs.writeFileSync(out, html);
console.log(out + ' — ' + n + ' scripts inlined, ' + Math.round(fs.statSync(out).size / 1024) + ' KB');
