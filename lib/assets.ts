export function stripBasePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (!basePath) return path
  if (path === basePath) return '/'
  if (path.startsWith(`${basePath}/`)) return path.slice(basePath.length) || '/'
  return path
}

export function withBasePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (!basePath || !path.startsWith('/') || path.startsWith('//')) {
    return path
  }

  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path
  }

  return `${basePath}${path}`
}
