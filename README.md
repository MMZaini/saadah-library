This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

## Reducing Vercel usage (images & edge)

If you're deploying on Vercel and seeing high usage for Image Optimization (transformations / cache writes / reads) or Edge/ISR metrics, try these strategies:

- Disable the Vercel image optimizer when you don't need server-side transformations. Set this environment variable in Vercel: `DISABLE_VERCEL_IMAGE_OPTIMIZATION=1`. That will flip `images.unoptimized` in `next.config.ts` and stop Next.js from generating transformed images on the server (this removes Transformations and Cache Writes/Reads costs but shifts responsibility to the client or a CDN).
- Prefer using pre-sized, optimized images stored on a CDN (e.g. Cloudflare, S3+CloudFront, or your hosting provider). Serve them via absolute URLs so Next.js doesn't try to transform them.
- Use responsive images (`<img srcset>` or Next.js `<Image />` with fixed sizes) so you avoid generating many transformer variants at different sizes. Keep `imageSizes` and `deviceSizes` minimal and aligned with your UI breakpoints.
- Avoid listing wide remotePatterns in `next.config.ts`; host frequently-used images on your own CDN or inlined assets when small.
- Cache aggressively at CDN level and set long cache TTLs for images that rarely change. This reduces cache reads and origin bandwidth on Vercel.
- If using many small images (icons/thumbnails), consider inlining them as SVG or using an icon font/sprite to avoid optimizer work.
- Audit image usage in pages that run on the Edge or via ISR; move non-critical images off-edge rendering paths when possible.

Using the `DISABLE_VERCEL_IMAGE_OPTIMIZATION=1` toggle is the quickest way to avoid the top three usage counters in Vercel (Transformations, Cache Writes, Cache Reads) while keeping the site functional.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




git reminder:

git add .
git commit -m "Describe your changes here"
git push
