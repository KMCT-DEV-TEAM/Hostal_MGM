const fs = require('fs');
const path = require('path');
const { transformSync } = require('esbuild');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('src', function(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        try {
            transformSync(content, { loader: filePath.endsWith('.jsx') ? 'jsx' : 'js' });
        } catch (e) {
            console.log('SYNTAX ERROR IN:', filePath);
            console.log(e.message);
            console.log('---');
        }
    }
});
