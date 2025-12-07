// Token refresh utility

const DOMAIN = import.meta.env.VITE_BACKEND || 'http://localhost:3000';
const BASE_URL = `${DOMAIN}/api/v1`;

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<boolean>} - True if refresh was successful
 */
export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.error('❌ No refresh token available');
      return false;
    }

    console.log('🔄 Attempting to refresh access token...');

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: sends cookies with the request
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store new refresh token
      if (data.data?.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }

      console.log('✅ Access token refreshed successfully');
      return true;
    } else {
      console.error('❌ Token refresh failed:', data.message);

      // If refresh fails, clear all authentication data
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');

      return false;
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return false;
  }
}

/**
 * Check if we need to refresh the token (call this before socket connection)
 * @returns {Promise<boolean>} - True if token is valid or was successfully refreshed
 */
export async function ensureValidToken() {
  // Note: accessToken is stored in httpOnly cookie, so we can't read it with JavaScript
  // We'll make a test API call to check if the token is valid

  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      credentials: 'include' // Send cookies
    });

    if (response.ok) {
      console.log('✅ Token is valid');
      return true;
    } else if (response.status === 401) {
      console.log('⚠️ Token expired or invalid, attempting refresh...');
      return await refreshAccessToken();
    } else {
      console.error('❌ Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking token:', error);
    return false;
  }
}
