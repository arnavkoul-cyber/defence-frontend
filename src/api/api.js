import axios from 'axios';
// https://dlp.jk.gov.in/api/api
// Base URL for API (change this for production)
// For local development: 'http://localhost:5000'
// For production: 'https://dlp.jk.gov.in/api'
const BASE_URL = 'http://localhost:5000';

// API instance with /api path
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }
});

// Helper function to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already a full URL
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const fullUrl = `${BASE_URL}/${cleanPath}`;
  
  console.log('Image URL:', fullUrl); // Debug log
  return fullUrl;
};

export default api;