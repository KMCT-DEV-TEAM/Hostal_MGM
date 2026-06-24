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
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/KMCT/Hostal_MGM/frontend/src');

let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/error\?\.response\?\.data\?\.message\s*\|\|\s*error\?\.message/g, 'error?.message');
  newContent = newContent.replace(/error\?\.response\?\.data\?\.message\s*\|\|\s*error\.message/g, 'error?.message');
  newContent = newContent.replace(/error\?\.response\?\.data\?\.message/g, 'error?.message');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated', file);
    count++;
  }
});

console.log(`Updated ${count} files.`);
