import Image, { ImageProps } from 'next/image'

// Small wrapper around next/image that lets us toggle Next.js image optimization
// via the NEXT_PUBLIC_DISABLE_VERCEL_IMAGE_OPTIMIZATION environment variable.
// When disabled, images are rendered without server-side transformations which
// prevents Vercel Image Optimization usage (transformations / cache writes / reads).

export default function OptimizedImage(props: ImageProps) {
  // Default to reasonable quality (reduces transformation sizes)
  const { quality = 75, alt, ...rest } = props

  return (
    <Image
      {...(rest as ImageProps)}
      alt={alt}
      quality={quality}
      // Force unoptimized to avoid upstream optimizer fetches/timeouts
      unoptimized={true}
    />
  )
}
