/**
 * Image security validation & sanitization for the image library.
 * All checks are skipped for admin users.
 */

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
// Base64 encoding increases size by ~1.37x
const MAX_DATA_URL_LENGTH = Math.ceil(MAX_FILE_SIZE_BYTES * 1.37) + 100; // extra for header

const MAX_IMAGES_PER_USER = 200;
const MAX_TOTAL_STORAGE_CHARS = 685_000_000; // ~500MB raw → ~685M base64 chars

// Magic bytes for each supported format
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  ],
};

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedDataUrl?: string;
}

/**
 * Validates and sanitizes an image data URL.
 * Returns the (possibly sanitized) data URL on success.
 */
export function validateImageDataUrl(dataUrl: string): ValidationResult {
  // 1. Basic format validation
  const headerMatch = dataUrl.match(/^data:(image\/[a-z+]+);base64,/);
  if (!headerMatch) {
    return { valid: false, error: 'Invalid data URL format' };
  }

  const mimeType = headerMatch[1];

  // 2. MIME type whitelist
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported image type: ${mimeType}. Allowed: PNG, JPEG, WebP, SVG` };
  }

  // 3. File size limit
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    return { valid: false, error: 'Image too large. Maximum size is 10MB' };
  }

  // Extract the base64 data
  const base64Data = dataUrl.substring(headerMatch[0].length);

  // 4. Validate base64 characters
  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64Data)) {
    return { valid: false, error: 'Invalid base64 data' };
  }

  // Decode base64 to binary
  let binaryData: Uint8Array;
  try {
    const binaryStr = atob(base64Data.replace(/\s/g, ''));
    binaryData = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      binaryData[i] = binaryStr.charCodeAt(i);
    }
  } catch {
    return { valid: false, error: 'Failed to decode base64 data' };
  }

  // 5. Magic bytes verification
  if (mimeType === 'image/svg+xml') {
    // SVG: check decoded text starts with <svg or <?xml
    const text = new TextDecoder().decode(binaryData).trim();
    if (!text.startsWith('<svg') && !text.startsWith('<?xml')) {
      return { valid: false, error: 'Invalid SVG file: does not start with <svg or <?xml' };
    }

    // 6. SVG sanitization
    const sanitized = sanitizeSvg(text);
    const sanitizedBase64 = btoa(unescape(encodeURIComponent(sanitized)));
    return {
      valid: true,
      sanitizedDataUrl: `data:image/svg+xml;base64,${sanitizedBase64}`,
    };
  } else {
    // Raster format: check magic bytes
    const magicChecks = MAGIC_BYTES[mimeType];
    if (magicChecks) {
      for (const check of magicChecks) {
        for (let i = 0; i < check.bytes.length; i++) {
          if (binaryData[check.offset + i] !== check.bytes[i]) {
            return {
              valid: false,
              error: `File content does not match declared type (${mimeType}). Possible disguised file.`,
            };
          }
        }
      }
    }

    return { valid: true, sanitizedDataUrl: dataUrl };
  }
}

/**
 * Sanitize SVG content by removing dangerous elements and attributes.
 */
function sanitizeSvg(svg: string): string {
  let sanitized = svg;

  // Remove <script> tags and their contents
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  sanitized = sanitized.replace(/<script[^>]*\/>/gi, '');

  // Remove <foreignObject> tags and their contents
  sanitized = sanitized.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');

  // Remove <iframe>, <embed>, <object> tags
  sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*\/>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/<object[\s\S]*?<\/object\s*>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*\/>/gi, '');

  // Remove all on* event handler attributes (onload, onerror, onclick, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: URLs from href and xlink:href attributes
  sanitized = sanitized.replace(
    /(href\s*=\s*(?:"|'))javascript:[^"']*(?:"|')/gi,
    '$1#$2'
  );
  sanitized = sanitized.replace(
    /(xlink:href\s*=\s*(?:"|'))javascript:[^"']*(?:"|')/gi,
    '$1#$2'
  );

  return sanitized;
}

/**
 * Check per-user limits (image count and total storage).
 * Returns null if within limits, or an error message if exceeded.
 */
export function checkUserLimits(
  currentImageCount: number,
  currentTotalStorageChars: number,
  newDataUrlLength: number
): string | null {
  if (currentImageCount >= MAX_IMAGES_PER_USER) {
    return `Image limit reached (${MAX_IMAGES_PER_USER} images). Delete some images to upload new ones.`;
  }

  if (currentTotalStorageChars + newDataUrlLength > MAX_TOTAL_STORAGE_CHARS) {
    return 'Storage limit reached (500MB). Delete some images to free up space.';
  }

  return null;
}
