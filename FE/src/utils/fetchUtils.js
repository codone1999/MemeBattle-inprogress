// src/utils/fetchUtils.js

const DOMAIN = import.meta.env.VITE_BACKEND || 'http://localhost:3000';
const BASE_URL = `${DOMAIN}/api/v1`;
const REFRESH_ENDPOINT = '/auth/refresh';

class HttpError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function saveRefreshToken(token) {
  localStorage.setItem('refreshToken', token);
}

function clearRefreshToken() {
  localStorage.removeItem('refreshToken');
}

let isRefreshing = false;
let failedQueue = [];

const subscribeTokenRefresh = (cb) => {
  failedQueue.push(cb);
};

const onRefreshed = () => {
  failedQueue.forEach(cb => cb());
  failedQueue = [];
};

async function refreshToken() {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new HttpError('No refresh token available. User must re-authenticate.', 401);
  }

  try {
    const refreshUrl = `${BASE_URL}${REFRESH_ENDPOINT}`;
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include', 
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken 
      })
    });

    let data;
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
    
    if (!response.ok) {
      clearRefreshToken();
      throw new HttpError(data?.message || 'Failed to refresh token', response.status, data);
    }

    if (data?.data?.refreshToken) {
        saveRefreshToken(data.data.refreshToken);
    }
    
    return true;
  } catch (error) {
    console.error('Refresh Token Error:', error);
    if (error instanceof HttpError) {
        clearRefreshToken();
    }
    throw error;
  }
}

export async function fetchApi(endpoint, options = {}, isRetry = false) {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers: defaultHeaders,
    body: options.body ? JSON.stringify(options.body) : null,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    let data;

    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : { success: response.ok, message: response.statusText };
    } catch (e) {
      if (response.ok) {
        return { success: true, message: 'Operation successful' };
      }
      throw new HttpError('Failed to parse JSON response from server.', response.status);
    }
    
    if (endpoint.endsWith('/login') && response.ok && data?.data?.refreshToken) {
        saveRefreshToken(data.data.refreshToken);
    }

    // Don't attempt token refresh for login or refresh endpoints
    // If login fails with 401, it means invalid credentials, not expired token
    const isAuthEndpoint = endpoint.endsWith('/login') || endpoint.endsWith('/register') || endpoint === REFRESH_ENDPOINT;

    if (response.status === 401 && !isRetry && !isAuthEndpoint) {
      
      const retryOriginalRequest = new Promise((resolve, reject) => {
        subscribeTokenRefresh(() => {
          fetchApi(endpoint, options, true)
            .then(resolve)
            .catch(reject);
        });
      });

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await refreshToken();
          isRefreshing = false;
          onRefreshed();
        } catch (refreshError) {
          isRefreshing = false;
          failedQueue.forEach(cb => cb(refreshError));
          failedQueue = [];
          throw refreshError; 
        }
      }

      return retryOriginalRequest;
    }


    if (!response.ok) {
      throw new HttpError(data.message || `HTTP error! status: ${response.status}`, response.status, data);
    }

    return data;

  } catch (error) {
    console.error('Fetch API error:', error);
    throw error;
  }
}
