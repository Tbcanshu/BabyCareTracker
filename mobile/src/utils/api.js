import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the environment variable if available, otherwise fallback to the live Railway URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL 
  ? `${process.env.EXPO_PUBLIC_API_URL}/v1` 
  : 'https://web-production-4f9cf.up.railway.app/api/v1';
export const setAuthToken = async (token) => {
  await AsyncStorage.setItem('auth_token', token);
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem('auth_token');
};

const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || data?.reply || 'API request failed');
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please check if your backend server is running.');
    }
    throw new Error(error.message || 'Network request failed');
  }
};

export const authApi = {
  register: (name, email, password) =>
    apiCall('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    apiCall('/auth/logout', { method: 'POST' }),

  getUser: () =>
    apiCall('/user', { method: 'GET' }),
};

export const activitiesApi = {
  getActivities: (babyId) =>
    apiCall(`/activities?baby_id=${babyId}`, { method: 'GET' }),

  logActivity: (babyId, type, notes) =>
    apiCall('/activities', { method: 'POST', body: JSON.stringify({ baby_id: babyId, type, notes }) }),
};

export const chatApi = {
  sendMessage: (message, history = [], baby = null) =>
    apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, baby }),
    }),
};

