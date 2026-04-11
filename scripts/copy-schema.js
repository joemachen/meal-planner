const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'src', 'main', 'db', 'schema.sql')
const dest = path.join(__dirname, '..', 'dist-electron', 'main', 'schema.sql')

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log('Copied schema.sql →', dest)
