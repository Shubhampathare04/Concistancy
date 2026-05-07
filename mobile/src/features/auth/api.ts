import { api } from '@/services/api';
import axios from 'axios';
import Constants from 'expo-constants';

// Get the device's local IP from Expo
const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const API_BASE = debuggerHost 
  ? `http://${debuggerHost}:8000/api/v1`
  : 'http://192.168.1.5:8000/api/v1';

console.log('🌐 API_BASE:', API_BASE);

export const authApi = {
  register: (email: string, password: string, name: string) =>
    axios.post(`${API_BASE}/auth/register`, { email, password, name }, { timeout: 10000 }),

  login: (email: string, password: string) => {
    console.log('🔐 Attempting login to:', `${API_BASE}/auth/login`);
    return axios.post(`${API_BASE}/auth/login`, { email, password }, { timeout: 10000 });
  },
};
