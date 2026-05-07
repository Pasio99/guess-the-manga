import { createHash } from 'node:crypto';
const normalize = (s='') => s.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/['’`]/g,'').replace(/[^\p{L}\p{N}]+/gu,'');
const aliases = process.argv.slice(2);
console.log(aliases.map(a=>({alias:a,normalized:normalize(a),hash:createHash('sha256').update(normalize(a)).digest('hex')})));
