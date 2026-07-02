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

        // Fix subtitle={\\   \ Students\} -> subtitle={"Students"}
        content = content.replace(/subtitle=\{\\\\\s*\\\s*Students\\\}/g, 'subtitle="Students"');
        
        // Fix orgCode = selectedOrg ? \\-\ : '';
        // Wait, \-\ is actually literally '\\-\' in regex or '\\\\-\\\\'
        content = content.replace(/const (\w+) = (\w+) \? \\\\-\\\\ : '';/g, 'const  =  ? \\-\ : \'\';');
        
        // Fix className={\lex... \}
        // Note: \f is \x0C
        content = content.replace(/className=\{\\\x0Clex([^}]*)\\\\\\}/g, 'className="flex"');
        
        // Fix triggerClassName={\px-3 ... \\}
        content = content.replace(/triggerClassName=\{\\px([^}]*)\\\\\}/g, 'triggerClassName="px"');
        
        // Fix className={\w-2 ... \}
        content = content.replace(/className=\{\\w-2([^}]*)\\\\\}/g, 'className="w-2"');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log('Fixed syntax in', filePath);
        }
    }
});
