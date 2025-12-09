import axios from 'axios';
// https://dlp.jk.gov.in/api/api
// Base URL for API (change this for production)
// For local development: 'http://localhost:5000'
// For production: 'https://dlp.jk.gov.in/api'
const BASE_URL = 'https://dlp.jk.gov.in/api';

// API instance with /api path
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    // Check if response contains expired flag
    if (response.data && response.data.expired === true) {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('sector_id');
      localStorage.removeItem('army_unit_id');
      
      // Redirect to login
      window.location.href = '/login';
      return Promise.reject(new Error('Token expired'));
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('sector_id');
      localStorage.removeItem('army_unit_id');
      
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already a full URL
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const fullUrl = `${BASE_URL}/${cleanPath}`;
  
 
  return fullUrl;
};

export default api;