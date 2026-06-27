import type { CSSProperties, ImgHTMLAttributes } from 'react'
import { resolveImage } from '../assets'

/**
 * Picture — serves AVIF/WebP with the original as fallback, responsive via the
 * generated manifest (see scripts/optimize-assets.mjs and ../assets.ts).
 *
 * Pass the SAME original src the app already uses (BASE_URL + assets/…). The
 * manifest lookup builds an exact srcset — only widths that were actually
 * generated, so no <source> ever 404s. Images not in the manifest
 * (new/unoptimized) degrade to a plain <img>.
 */

interface PictureProps {
  src: string
  alt: string
  /** Layout hint for srcset selection. Default '100vw' (safe over-estimate). */
  sizes?: string
  className?: string
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading']
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding']
  style?: CSSProperties
}

export function Picture({
  src,
  alt,
  sizes = '100vw',
  className,
  loading = 'lazy',
  decoding = 'async',
  style,
}: PictureProps) {
  const img = resolveImage(src)

  if (!img) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        style={style}
      />
    )
  }

  return (
    <picture>
      <source type="image/avif" srcSet={img.avif} sizes={sizes} />
      <source type="image/webp" srcSet={img.webp} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        width={img.w}
        height={img.h}
        style={style}
      />
    </picture>
  )
}
