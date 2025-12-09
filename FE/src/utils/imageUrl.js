/**
 * Utility for constructing image URLs with environment-based base URL
 *
 * This allows easy deployment to different environments (local, staging, production)
 * by setting VITE_ASSETS_BASE_URL in .env
 */

const baseUrl = import.meta.env.VITE_ASSETS_BASE_URL || '';

/**
 * Get the full URL for an image path
 * @param {string} path - Image path (e.g., '/cards/my-card.png')
 * @returns {string} - Full image URL
 */
export function getImageUrl(path) {
  if (!path) return '';

  // If path is already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Construct URL with base
  return `${baseUrl}${path}`;
}

/**
 * Get default image URL for a type
 * @param {string} type - Image type ('card', 'character', 'avatar')
 * @returns {string} - Default image URL
 */
export function getDefaultImageUrl(type = 'card') {
  const defaults = {
    card: '/cards/default-card.png',
    character: '/characters/default-character.png',
    avatar: '/avatars/default-avatar.png'
  };

  return getImageUrl(defaults[type] || defaults.card);
}
