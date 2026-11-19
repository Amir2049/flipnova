// Builds dist/gift-maker.html: one self-contained page with the game's real sprite code inlined,
// so the preview is exactly what the game draws. usage: node tools/build-gift-maker.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const game = ['js/core.js', 'js/sprites.js'].map(read).join('\n').replace(/<\/script/gi, '<\\/script');
const setup = read('tools/supabase-gifts.sql');
const page = read('tools/gift-maker.src.html')
  .replace('/*@@GAME@@*/', () => game)
  .replace("/*@@SETUP@@*/''", () => JSON.stringify(setup).replace(/<\/script/gi, '<\\/script'));
fs.writeFileSync(path.join(root, 'dist', 'gift-maker.html'), page);
console.log('dist/gift-maker.html', Math.round(page.length / 1024) + 'KB');
