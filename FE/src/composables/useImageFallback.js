/**
 * Composable for handling image loading with fallback hierarchy
 *
 * Usage:
 * const { handleImageError } = useImageFallback('card');
 * <img :src="imagePath" @error="handleImageError" />
 */

export function useImageFallback(type = 'card') {
  // Get base URL from environment variable (for deployment flexibility)
  const baseUrl = import.meta.env.VITE_ASSETS_BASE_URL || '';

  // Define default images for each type
  const defaults = {
    card: `${baseUrl}/cards/default-card.png`,
    character: `${baseUrl}/characters/default-character.png`,
    avatar: `${baseUrl}/avatars/default-avatar.png`
  };

  const defaultImage = defaults[type] || defaults.card;

  /**
   * Handle image loading error with fallback hierarchy
   * 1. Try original image from database
   * 2. If fails, try default image
   * 3. If default fails, hide image (let parent show emoji fallback)
   *
   * @param {Event} event - The error event from img element
   */
  const handleImageError = (event) => {
    const img = event.target;
    const currentSrc = img.src;

    // Check if we're already showing the default image
    const isShowingDefault = currentSrc.includes(defaultImage);

    if (!isShowingDefault) {
      // First failure - try the default image
      console.log(`Image failed to load: ${currentSrc}, trying default: ${defaultImage}`);
      img.src = defaultImage;
    } else {
      // Default also failed - hide the image element
      console.log(`Default image also failed: ${defaultImage}, hiding image`);
      img.style.display = 'none';

      // Optionally emit an event or set a flag that parent can use
      img.setAttribute('data-image-failed', 'true');
    }
  };

  return {
    handleImageError,
    defaultImage
  };
}
