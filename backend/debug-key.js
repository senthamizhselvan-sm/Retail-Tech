require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
console.log('Key length:', key.length);
for (let i = 0; i < key.length; i++) {
    console.log(`char[${i}]: ${key[i]} (${key.charCodeAt(i)})`);
}
