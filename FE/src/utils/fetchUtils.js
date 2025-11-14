// src/utils/fetchUtils.js

const BASE_URL = 'http://localhost:3000/api/v1';

class HttpError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data; // เก็บ data ที่ backend ส่งมา (ถ้ามี)
  }
}

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers: defaultHeaders,
    body: options.body ? JSON.stringify(options.body) : null,
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

    if (!response.ok) {
      // โยน HttpError ที่มี message และ status
      throw new HttpError(data.message || `HTTP error! status: ${response.status}`, response.status, data);
    }

    return data; // คืนค่า data ที่ได้จาก backend

  } catch (error) {
    console.error('Fetch API error:', error);
    // โยน error ต่อเพื่อให้ component ที่เรียกใช้จัดการ
    throw error;
  }
}