const argon2 = require('argon2');
const password = process.argv[2] || 'AnandaCore2026!';
argon2.hash(password, {type: argon2.argon2id}).then(h => console.log(h));
