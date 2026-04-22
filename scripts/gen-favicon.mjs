import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svg = readFileSync(resolve(root, 'src/app/icon.svg'))

const sizes = [16, 32, 48]
const pngs = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
)

function buildIco(images) {
  const n = images.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(n, 4)

  const dir = Buffer.alloc(16 * n)
  let offset = 6 + 16 * n
  const entries = []

  images.forEach((png, i) => {
    const size = sizes[i]
    const w = size >= 256 ? 0 : size
    const h = size >= 256 ? 0 : size
    dir.writeUInt8(w, i * 16 + 0)
    dir.writeUInt8(h, i * 16 + 1)
    dir.writeUInt8(0, i * 16 + 2)
    dir.writeUInt8(0, i * 16 + 3)
    dir.writeUInt16LE(1, i * 16 + 4)
    dir.writeUInt16LE(32, i * 16 + 6)
    dir.writeUInt32LE(png.length, i * 16 + 8)
    dir.writeUInt32LE(offset, i * 16 + 12)
    entries.push(png)
    offset += png.length
  })

  return Buffer.concat([header, dir, ...entries])
}

const ico = buildIco(pngs)
writeFileSync(resolve(root, 'src/app/favicon.ico'), ico)
console.log('✓ favicon.ico régénéré (16/32/48px)')
