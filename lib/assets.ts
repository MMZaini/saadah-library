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
