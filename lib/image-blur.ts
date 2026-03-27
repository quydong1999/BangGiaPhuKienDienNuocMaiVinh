/**
 * Generates a Cloudinary blur URL from an original Cloudinary URL.
 * Uses Cloudinary transformations to create a tiny, blurred version.
 */
export function getCloudinaryBlurUrl(url: string): string {
  // Match Cloudinary URL pattern: .../upload/... or .../upload/v1234/...
  return url.replace(
    /\/upload\/(v\d+\/)?/,
    '/upload/w_20,q_10,e_blur:1000,f_webp/$1'
  );
}

/**
 * Shimmer SVG placeholder for non-Cloudinary images or fallback.
 * Creates an animated shimmer effect as base64 data URL.
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e2e8f0" offset="20%" />
      <stop stop-color="#f1f5f9" offset="50%" />
      <stop stop-color="#e2e8f0" offset="80%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#e2e8f0" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.5s" repeatCount="indefinite" />
</svg>`;

function toBase64(str: string) {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
}

export function getShimmerDataUrl(w = 400, h = 300): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
}

/**
 * Returns the blur placeholder for an image URL.
 * - Cloudinary images: uses Cloudinary blur transformation
 * - Other images: uses shimmer SVG
 */
export function getBlurPlaceholder(imageUrl: string | undefined, w = 400, h = 300) {
  if (!imageUrl) {
    return { placeholder: 'blur' as const, blurDataURL: getShimmerDataUrl(w, h) };
  }

  if (imageUrl.includes('res.cloudinary.com')) {
    return { placeholder: 'blur' as const, blurDataURL: getCloudinaryBlurUrl(imageUrl) };
  }

  return { placeholder: 'blur' as const, blurDataURL: getShimmerDataUrl(w, h) };
}

/**
 * Transforms a regular Cloudinary URL into an optimized version.
 * - Injects f_auto,q_auto for automatic format and quality.
 * - Optionally injects w_WIDTH,c_limit for resizing.
 */
export function getOptimizedImageUrl(url: string | undefined, width?: number): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;

  const transform = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';

  // Match Cloudinary URL pattern: .../upload/... or .../upload/v1234/...
  return url.replace(
    /\/upload\/(v\d+\/)?/,
    `/upload/${transform}/$1`
  );
}
