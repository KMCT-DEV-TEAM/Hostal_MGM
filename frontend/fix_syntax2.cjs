const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('src/features/dashboard/components', function(filePath) {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Fix className={\w-2 h-2 rounded-full \ mr-2\}
        content = content.replace(/className=\{\\\\w-2([^}]*)\\\\\}/g, 'className="w-2"');
        
        // Let's try a broader regex for {\w-2
        // Actually, in the file it literally says: className={\w-2 h-2 rounded-full \ mr-2\}
        content = content.replace(/className=\{\\w-2 h-2 rounded-full \\ mr-2\\\}/g, 'className="w-2 h-2 rounded-full mr-2"');

        // And BatchFormModal:70 \x0Clex -> \f
        content = content.replace(/className=\{\\f/g, 'className={"f');
        content = content.replace(/className=\{\\x0Clex-1 w-full px-3 py-2 bg-gray-50\/50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-\[#0A437A\] \\ \\\\\}/g, 'className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#0A437A]"');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log('Fixed syntax in', filePath);
        }
    }
});
