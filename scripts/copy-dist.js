// Script to copy frontend dist to backend/public (cross-platform)
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'frontend', 'dist')
const dest = path.join(__dirname, '..', 'backend', 'public')

function copyDir(s, d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, entry.name)
    const dp = path.join(d, entry.name)
    if (entry.isDirectory()) {
      copyDir(sp, dp)
    } else {
      fs.copyFileSync(sp, dp)
    }
  }
}

if (fs.existsSync(src)) {
  copyDir(src, dest)
  console.log('✅ Frontend dist copied to backend/public')
} else {
  console.error('❌ frontend/dist not found. Run frontend build first.')
  process.exit(1)
}
