// packs the prototype into one HTML file (scripts + the title font inline)
const fs = require('fs');
const js = (p) => fs.readFileSync(p, 'utf8').replace(/<\/script/gi, '<\\/script');
const font = fs.readFileSync('/tmp/w36/fonts/cinzel-900.woff2').toString('base64');
const font7 = fs.readFileSync('/tmp/w36/tools/trailer/fonts/cinzel-700.woff2').toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<title>FLIPNOVA · THE CRIMSON TYRANT (prototype)</title>
<style>@font-face{font-family:Cinzel;font-weight:900;src:url(data:font/woff2;base64,${font}) format('woff2')}@font-face{font-family:Cinzel;font-weight:700;src:url(data:font/woff2;base64,${font7}) format('woff2')}
html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}canvas{display:block}</style></head>
<body><canvas id="c"></canvas>
<script>window.FF={};</script>
<script>${js('/tmp/w36/js/hdart.js')}</script>
<script>${js('/tmp/w36/js/hdboss.js')}</script>
<script>document.fonts&&document.fonts.load('900 60px Cinzel');document.fonts&&document.fonts.load('700 40px Cinzel');</script>
<script>${js(__dirname + '/game.js')}</script>
</body></html>`;
fs.writeFileSync(__dirname + '/FLIPNOVA-tyrant-prototype.html', html); // (the built file is not committed)
console.log('built', (html.length / 1024).toFixed(0) + ' KB');
