import Image, { ImageProps } from 'next/image'

// Small wrapper around next/image that lets us toggle Next.js image optimization
// via the NEXT_PUBLIC_DISABLE_VERCEL_IMAGE_OPTIMIZATION environment variable.
// When disabled, images are rendered without server-side transformations which
// prevents Vercel Image Optimization usage (transformations / cache writes / reads).
const DISABLE = true

export default function OptimizedImage(props: ImageProps & { unoptimized?: boolean }) {
  // Default to reasonable quality (reduces transformation sizes)
  const { quality = 75, unoptimized, ...rest } = props

  return (
    <Image
      {...(rest as ImageProps)}
      quality={quality}
      // Force unoptimized to avoid upstream optimizer fetches/timeouts
      unoptimized={true}
    />
  )
}
