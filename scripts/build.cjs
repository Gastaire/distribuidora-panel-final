const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/standalone');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const sources = [];
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace(/<script src="[^"]*babel\.min\.js"><\/script>/, '')
    .replace(/<script type="text\/babel"(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g, (_, src, inline) => {
        sources.push(src ? fs.readFileSync(path.join(root, src), 'utf8') : inline);
        return '';
    })
    .replace('</body>', '    <script src="panel.js"></script>\n</body>');
if (!sources.length) throw new Error('No se encontraron los scripts del panel.');

fs.mkdirSync(output, { recursive: true });
const compiled = babel.transform(sources.join('\n;\n'), {
    sourceType: 'script',
    presets: [['react', { runtime: 'classic' }]],
    minified: true,
    comments: false
}).code;
fs.writeFileSync(path.join(output, 'panel.js'), compiled);
fs.writeFileSync(path.join(output, 'index.html'), html);
for (const entry of ['manifest.json', 'styles']) {
    fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
