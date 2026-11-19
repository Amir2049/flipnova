// packs the run-and-gun Tyrant fight into one HTML file to play on a phone (scripts + the title font inline)
// usage: node tools/tyrantfight/build.js OUT.html
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..');
const js = (p) => fs.readFileSync(path.join(R, p), 'utf8').replace(/<\/script/gi, '<\\/script');
const font = fs.readFileSync(path.join(R, 'fonts/cinzel-900.woff2')).toString('base64');
const font7 = fs.readFileSync(path.join(R, 'tools/trailer/fonts/cinzel-700.woff2')).toString('base64');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'FLIPNOVA-tyrant-fight.html'));
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<title>FLIPNOVA · THE CRIMSON TYRANT</title>
<style>@font-face{font-family:Cinzel;font-weight:900;src:url(data:font/woff2;base64,${font}) format('woff2')}@font-face{font-family:Cinzel;font-weight:700;src:url(data:font/woff2;base64,${font7}) format('woff2')}
html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;font-family:Cinzel,serif;color:#f2e6cc}
#go{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 45%,#3a0a06,#000 70%);text-align:center;padding:16px}
#go h1{margin:0;font-size:min(9vw,72px);color:#ff5a2a;text-shadow:0 0 30px #ff3a10}#go p{margin:0;font:700 min(4vw,22px) sans-serif;opacity:.85}
#go button{font:900 min(5vw,30px) Cinzel,serif;padding:14px 34px;border-radius:14px;border:2px solid #ffd27a;background:#2a0a04;color:#ffd27a;cursor:pointer}
#res{font:700 min(4vw,22px) sans-serif;color:#ffd27a;min-height:1.4em}</style></head>
<body><div id="go"><h1>THE CRIMSON TYRANT</h1><p dir="rtl">اضغط = اقلب الجاذبية · فليبو بيضرب نار لوحده · اتفادى كل حاجة · ٣ قلوب</p><div id="res"></div>
<button id="en">PLAY</button><button id="ar">العب بالعربي</button></div>
<script>window.FF={C:36,F:156};</script>
<script>${js('js/hdart.js')}</script>
<script>${js('js/hdboss.js')}</script>
<script>${js('js/tyrantfight.js')}</script>
<script>
document.fonts&&document.fonts.load('900 60px Cinzel');document.fonts&&document.fonts.load('700 40px Cinzel');
const go=document.getElementById('go'),res=document.getElementById('res');
function start(lang){go.style.display='none';FF.TyrantFight.play({lang},function(r){go.style.display='flex';res.textContent=r.win?('VICTORY · '+r.time+'s · falls '+r.deaths+' · rank '+r.rank):'';});}
document.getElementById('en').onclick=()=>start('en');document.getElementById('ar').onclick=()=>start('ar');
</script>
</body></html>`;
fs.writeFileSync(OUT, html);
console.log('built', OUT, (html.length / 1024).toFixed(0) + ' KB');
