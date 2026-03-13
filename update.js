const fs = require('fs');
let c = fs.readFileSync('lib/search-utils.ts', 'utf8');
const oldRegex = 'const regex = new RegExp((\), ''gi'')';
const newRegex = 'const joined = patterns.join(''|'');\n  const regex = options.exactMatch \n    ? new RegExp((?<![\\\\p{L}\\\\p{M}\\\\p{N}_])(\)(?![\\\\p{L}\\\\p{M}\\\\p{N}_]), ''giu'')\n    : new RegExp((\), ''gi'');';
c = c.replace(oldRegex, newRegex);
fs.writeFileSync('lib/search-utils.ts', c);
console.log('done updating highlighter in search-utils');
