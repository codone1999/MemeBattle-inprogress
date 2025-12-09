/**
 * Vue directive for handling image loading with fallback
 *
 * Usage:
 * <img :src="path" v-image-fallback:card />
 * <img :src="path" v-image-fallback:character />
 * <img :src="path" v-image-fallback:avatar />
 */

// Get base URL from environment variable (for deployment flexibility)
const baseUrl = import.meta.env.VITE_ASSETS_BASE_URL || '';

const defaults = {
  card: `${baseUrl}/cards/default-card.png`,
  character: `${baseUrl}/characters/default-character.png`,
  avatar: `${baseUrl}/avatars/default-avatar.png`
};

export const imageFallback = {
  mounted(el, binding) {
    const type = binding.arg || 'card';
    const defaultImage = defaults[type];

    el.addEventListener('error', function onError(event) {
      const img = event.target;
      const currentSrc = img.src;

      // Check if we're already showing the default image
      const isShowingDefault = currentSrc.includes(defaultImage);

      if (!isShowingDefault && defaultImage) {
        // First failure - try the default image
        console.log(`[Image Fallback] Failed to load: ${currentSrc}, trying default: ${defaultImage}`);
        img.src = defaultImage;
      } else {
        // Default also failed - hide the image element
        console.log(`[Image Fallback] Default image also failed: ${defaultImage}, hiding image`);
        img.style.display = 'none';
        img.setAttribute('data-image-failed', 'true');
      }
    });
  }
};

export default imageFallback;
