import axios from 'axios';
const api = axios.create({ baseURL: 'https://dlp.jk.gov.in/api' });
export default api;