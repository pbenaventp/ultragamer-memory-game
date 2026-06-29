const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const JavaScriptObfuscator = require('javascript-obfuscator');
const htmlMinifier = require('html-minifier').minify;

const dist = path.join(__dirname, 'dist');
const assets = path.join(__dirname, 'assets');

console.log('--- Starting Ultragamer Memory Match EXTREME Build Process ---');

if (fs.existsSync(dist)) {
    fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist);

console.log('Analyzing used assets...');
const usedAssets = new Set();

const filesToAnalyze = [
    { name: 'index.js', content: fs.readFileSync('index.js', 'utf8') },
    { name: 'index.css', content: fs.readFileSync('index.css', 'utf8') },
    { name: 'index.html', content: fs.readFileSync('index.html', 'utf8') }
];

const assetPatterns = [
    /['"](?:\.\/)?(assets\/[^'"]+)['"]/gi,
    /url\(['"]?(?:\.\/)?(assets\/[^'"\)]+)['"]?\)/gi
];

filesToAnalyze.forEach(file => {
    assetPatterns.forEach(regex => {
        let match;
        while ((match = regex.exec(file.content)) !== null) {
            let cleanPath = match[1].replace(/^\.\//, '');
            try {
                cleanPath = decodeURIComponent(cleanPath);
                usedAssets.add(cleanPath);
            } catch (e) {
                usedAssets.add(cleanPath);
            }
        }
    });
});

usedAssets.add('assets/img/logos/main_logo.svg');
usedAssets.add('assets/img/logos/logo_ingame.svg');
usedAssets.add('assets/img/logos/logo_cards.svg');
usedAssets.add('assets/img/bg/background.png');

console.log(`Found ${usedAssets.size} unique assets. Copying to dist...`);

usedAssets.forEach(assetPath => {
    const srcPath = path.join(__dirname, assetPath);
    const destPath = path.join(dist, assetPath);

    if (fs.existsSync(srcPath)) {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
    } else {
        console.warn(`[WARNING] Asset not found: ${srcPath}`);
    }
});

console.log('Processing CSS for Injection...');
const cssContent = fs.readFileSync('index.css', 'utf8');
const minifiedCss = new CleanCSS({}).minify(cssContent).styles;

console.log('Processing HTML for Injection...');
const htmlContent = fs.readFileSync('index.html', 'utf8');
const bodyMatch = htmlContent.match(/<body>([\s\S]*)<\/body>/);
const bodyContent = bodyMatch ? bodyMatch[1] : '';
const minifiedBody = htmlMinifier(bodyContent, {
    collapseWhitespace: true,
    removeComments: true
});

console.log('Merging and Obfuscating EVERYTHING...');
const stringsJs = fs.readFileSync('strings.js', 'utf8');
let originalJs = fs.readFileSync('index.js', 'utf8');

originalJs = originalJs.replace(/document\.addEventListener\(['"]DOMContentLoaded['"],\s*\(\)\s*=>\s*\{\s*([\s\S]*?)\s*\}\);?/g, '$1');

const injectionScript = `
(function() {
    const style = document.createElement('style');
    style.innerHTML = \`${minifiedCss.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
    document.head.appendChild(style);
    
    document.body.innerHTML = \`${minifiedBody.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
    
    ${stringsJs}
    
    ${originalJs}
})();
`;

const obfuscationResult = JavaScriptObfuscator.obfuscate(injectionScript, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.1,
    numbersToExpressions: false,
    simplify: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    selfDefending: true,
    splitStrings: true,
    splitStringsChunkLength: 5
});

fs.writeFileSync(path.join(dist, 'index.js'), obfuscationResult.getObfuscatedCode());

console.log('Creating Shell HTML...');
const headMatch = htmlContent.match(/<head>([\s\S]*)<\/head>/);
let headContent = headMatch ? headMatch[1] : '';

headContent = headContent.replace(/<link\s+[^>]*href=["']index\.css["'][^>]*>/gi, '');
headContent = headContent.replace(/<script\s+[^>]*src=["']strings\.js["'][^>]*>\s*<\/script>/gi, '');

const shellHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    ${headContent}
    <link rel="preload" as="image" href="assets/img/logos/main_logo.svg">
    <style>
        body { background: #1d1d1d; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; font-family: sans-serif; }
        .overlay { position: fixed; inset: 0; background: radial-gradient(circle at center, #264534 0%, #1d1d1d 100%); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal { background: #1d1d1d; padding: 60px 40px; border-radius: 28px; border: 2px solid #3abff0; width: 95%; max-width: 620px; min-height: 450px; box-shadow: 0 0 40px rgba(58, 191, 240, 0.25); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .modal-logo { width: 80%; max-width: 380px; height: auto; margin-bottom: 25px; filter: drop-shadow(0 0 15px rgba(58, 191, 240, 0.55)); }
    </style>
</head>
<body>
    <script src="index.js"></script>
</body>
</html>
`;

const minifiedShell = htmlMinifier(shellHtml, {
    collapseWhitespace: true,
    removeComments: true
});
fs.writeFileSync(path.join(dist, 'index.html'), minifiedShell);

console.log('--- EXTREME Build Complete! Production assets stored in /dist ---');
