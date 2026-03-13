import { describe, it, expect } from 'vitest'
import { walkDirectory, classifyFile, buildPayload } from './deploy.js'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('walkDirectory', () => {
  it('collects files recursively', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kl-test-'))
    writeFileSync(join(dir, 'index.html'), '<h1>Hi</h1>')
    mkdirSync(join(dir, 'assets'))
    writeFileSync(join(dir, 'assets', 'style.css'), 'body {}')

    const files = walkDirectory(dir)

    expect(files).toHaveLength(2)
    expect(files.some(f => f.endsWith('index.html'))).toBe(true)
    expect(files.some(f => f.endsWith('style.css'))).toBe(true)
  })

  it('skips dotfiles and node_modules', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kl-test-'))
    writeFileSync(join(dir, 'index.html'), '<h1>Hi</h1>')
    writeFileSync(join(dir, '.env'), 'SECRET=123')
    mkdirSync(join(dir, 'node_modules'))
    writeFileSync(join(dir, 'node_modules', 'foo.js'), 'module.exports = {}')

    const files = walkDirectory(dir)

    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/index\.html$/)
  })
})

describe('classifyFile', () => {
  it('classifies HTML as text', () => {
    const result = classifyFile('index.html')
    expect(result.isText).toBe(true)
    expect(result.contentType).toBe('text/html')
  })

  it('classifies PNG as binary', () => {
    const result = classifyFile('logo.png')
    expect(result.isText).toBe(false)
    expect(result.contentType).toBe('image/png')
  })

  it('classifies unknown extensions as binary', () => {
    const result = classifyFile('data.bin')
    expect(result.isText).toBe(false)
    expect(result.contentType).toBe('application/octet-stream')
  })

  it('classifies source maps as text', () => {
    const result = classifyFile('app.js.map')
    expect(result.isText).toBe(true)
    expect(result.contentType).toBe('application/json')
  })
})

describe('buildPayload', () => {
  it('builds correct payload structure', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kl-test-'))
    writeFileSync(join(dir, 'index.html'), '<h1>Hello</h1>')

    const payload = buildPayload(dir, 'my-project')

    expect(payload.name).toBe('my-project')
    expect(payload.files).toHaveLength(1)
    expect(payload.files[0].filename).toBe('index.html')
    expect(payload.files[0].content).toBe('<h1>Hello</h1>')
    expect(payload.files[0].content_type).toBe('text/html')
    expect(payload.files[0].encoding).toBe('utf-8')
  })

  it('base64 encodes binary files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kl-test-'))
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    writeFileSync(join(dir, 'image.png'), pngHeader)

    const payload = buildPayload(dir, 'my-project')

    const file = payload.files.find(f => f.filename === 'image.png')
    expect(file.encoding).toBe('base64')
    expect(file.content_type).toBe('image/png')
    // Verify round-trip
    expect(Buffer.from(file.content, 'base64')).toEqual(pngHeader)
  })
})
