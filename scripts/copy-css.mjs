import { copyFileSync, readdirSync } from 'node:fs'

for (const name of readdirSync('src')) {
  if (name.endsWith('.css')) copyFileSync(`src/${name}`, `dist/${name}`)
}
