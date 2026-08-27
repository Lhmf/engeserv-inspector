const fs = require('fs');
const path = require('path');

const dir = 'src/modules/report/templates/nr13/pdf';

const files = fs.readdirSync(dir).filter(f =>
  f.endsWith('.ts') && !['context.ts', 'index.ts', 'builder.ts'].includes(f)
);

function findFirstArg(content, openParenIdx) {
  let i = openParenIdx + 1;
  const len = content.length;

  while (i < len && /\s/.test(content[i])) i++;

  const start = i;

  if (content[i] === '"' || content[i] === "'" || content[i] === '`') {
    const quote = content[i];
    i++;
    while (i < len) {
      if (content[i] === '\\') { i += 2; continue; }
      if (content[i] === quote) { i++; break; }
      i++;
    }
  } else {
    let depth = 0;
    while (i < len) {
      if (content[i] === '(' || content[i] === '[' || content[i] === '{') depth++;
      else if (content[i] === ')' || content[i] === ']' || content[i] === '}') {
        if (depth === 0) break;
        depth--;
      }
      else if (content[i] === ',' && depth === 0) break;
      i++;
    }
  }

  return { start, end: i, text: content.slice(start, i).trim() };
}

let totalUpdated = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add import if needed
  if (content.includes('page.drawText') && !content.includes('import { sanitizeTextForWinAnsi }')) {
    const lines = content.split('\n');
    let lastImportLine = -1;
    for (let idx = 0; idx < lines.length; idx++) {
      if (lines[idx].match(/}\s+from\s+['"]\.\/context['"]/)) {
        lastImportLine = idx;
      }
    }
    if (lastImportLine >= 0) {
      lines.splice(lastImportLine + 1, 0, "import { sanitizeTextForWinAnsi } from './context';");
      content = lines.join('\n');
    }
  }

  // 2. Wrap first arg of page.drawText and ctx.page.drawText
  const patterns = ['page.drawText(', 'ctx.page.drawText('];
  const replacements = [];

  for (const pattern of patterns) {
    let searchIdx = 0;
    while (true) {
      const matchIdx = content.indexOf(pattern, searchIdx);
      if (matchIdx < 0) break;

      const openParenIdx = matchIdx + pattern.length - 1;
      const arg = findFirstArg(content, openParenIdx);

      if (arg.text.includes('sanitizeTextForWinAnsi')) {
        searchIdx = openParenIdx + 1;
        continue;
      }

      replacements.push({
        start: arg.start,
        end: arg.end,
        newText: 'sanitizeTextForWinAnsi(' + arg.text + ')'
      });
      searchIdx = openParenIdx + 1;
    }
  }

  // Apply replacements in reverse order
  replacements.sort((a, b) => b.start - a.start);
  for (const r of replacements) {
    content = content.slice(0, r.start) + r.newText + content.slice(r.end);
  }

  if (replacements.length > 0) {
    fs.writeFileSync(filePath, content);
    console.log(file + ': ' + replacements.length + ' replacements');
    totalUpdated++;
  }
}

console.log('Total files updated: ' + totalUpdated);
