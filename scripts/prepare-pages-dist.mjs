import { copyFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const distDir = 'dist'

copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'))
writeFileSync(join(distDir, '.nojekyll'), '')

console.log('GitHub Pages: 404.html e .nojekyll gerados em dist/')
