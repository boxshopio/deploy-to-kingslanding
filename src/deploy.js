import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative, extname } from 'node:path'

const TEXT_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json',
  '.svg', '.xml', '.txt', '.md', '.map', '.ts', '.tsx',
  '.jsx', '.yaml', '.yml', '.toml', '.csv', '.webmanifest',
])

const MIME_TYPES = {
  '.html': 'text/html', '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript', '.mjs': 'application/javascript', '.cjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml', '.xml': 'application/xml',
  '.txt': 'text/plain', '.md': 'text/plain',
  '.map': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.svn', '__pycache__'])
const MAX_PAYLOAD_BYTES = 9 * 1024 * 1024  // 9MB

export function walkDirectory(dir) {
  const files = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue
    if (SKIP_DIRS.has(entry.name)) continue

    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkDirectory(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

export function classifyFile(filePath) {
  const ext = extname(filePath).toLowerCase()
  const isText = TEXT_EXTENSIONS.has(ext)
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  return { isText, contentType }
}

export function buildPayload(directory, project) {
  const absoluteDir = resolve(directory)
  const filePaths = walkDirectory(absoluteDir)
  const files = []

  for (const filePath of filePaths) {
    const filename = relative(absoluteDir, filePath)
    const { isText, contentType } = classifyFile(filePath)

    let content, encoding
    if (isText) {
      content = readFileSync(filePath, 'utf-8')
      encoding = 'utf-8'
    } else {
      content = readFileSync(filePath).toString('base64')
      encoding = 'base64'
    }

    files.push({ filename, content, content_type: contentType, encoding })
  }

  return { name: project, files }
}

export async function deploy({ directory, project, deployKey, apiUrl }) {
  const payload = buildPayload(directory, project)
  const body = JSON.stringify(payload)

  if (Buffer.byteLength(body) > MAX_PAYLOAD_BYTES) {
    throw new Error(
      `Payload size (${(Buffer.byteLength(body) / 1024 / 1024).toFixed(1)}MB) exceeds 9MB limit. ` +
      `See https://github.com/boxshopio/kingslanding/issues/209 for multipart upload support.`
    )
  }

  const url = `${apiUrl.replace(/\/$/, '')}/api/v1/upload`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deployKey}`,
    },
    body,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Deploy failed (${response.status}): ${error}`)
  }

  const result = await response.json()
  return {
    deploymentId: result.deployment_id,
    projectUrl: result.path,
    message: result.message,
  }
}
