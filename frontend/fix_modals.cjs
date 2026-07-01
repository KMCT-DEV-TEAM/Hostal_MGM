const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('d:/KMCT/Projects/Hostal_MGM/frontend/src/features/dashboard');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Replace outer wrapper
    const outerRegex = /className="(fixed inset-0 bg-black\/40 backdrop-blur-\[2px\] flex items-center justify-center p-[^" ]+ z-50)"/g;
    if (outerRegex.test(content)) {
        content = content.replace(outerRegex, `className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50"`);
        changed = true;
    }
    
    // Also catch some that might have sm:p-4
    const outerRegex2 = /className="(fixed inset-0 bg-black\/40 backdrop-blur-\[2px\] flex items-center justify-center p-[^ ]+ sm:p-[^ ]+ z-50)"/g;
    if (outerRegex2.test(content)) {
        content = content.replace(outerRegex2, `className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 z-50"`);
        changed = true;
    }

    // 2. Replace inner wrapper
    // Usually it has rounded-2xl and animate-in fade-in zoom-in-95 duration-200
    const innerRegex = /className="([^"]*)rounded-2xl([^"]*)animate-in fade-in zoom-in-95 duration-200([^"]*)"/g;
    if (innerRegex.test(content)) {
        content = content.replace(innerRegex, `className="$1rounded-t-2xl md:rounded-2xl rounded-b-none$2animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200$3"`);
        changed = true;
    }
    
    // Sometimes it's rounded-xl
    const innerRegex2 = /className="([^"]*)rounded-xl([^"]*)animate-in fade-in zoom-in-95 duration-200([^"]*)"/g;
    if (innerRegex2.test(content)) {
        content = content.replace(innerRegex2, `className="$1rounded-t-2xl md:rounded-xl rounded-b-none$2animate-slide-up md:animate-in md:slide-in-from-bottom-0 md:fade-in md:zoom-in-95 mt-auto md:mt-0 duration-200$3"`);
        changed = true;
    }

    // Replace Modal imports usage
    const modalRegex = /<Modal([^>]*)>/g;
    let modalChanged = false;
    let newContent = content.replace(modalRegex, (match, p1) => {
        if (!p1.includes("bottomSheetOnMobile")) {
            modalChanged = true;
            return `<Modal bottomSheetOnMobile={true}${p1}>`;
        }
        return match;
    });

    if (modalChanged) {
        content = newContent;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
