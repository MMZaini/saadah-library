declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.webp'
declare module '*.avif'
declare module '*.ico'
declare module '*.svg' {
  const content: string
  export default content
}
