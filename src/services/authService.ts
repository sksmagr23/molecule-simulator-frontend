import axios from 'axios';

axios.defaults.withCredentials = true;

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:3000';

const logout = () => {
  return axios.post(`${BACKEND_URL}/auth/logout`);
};

const googleLogin = () => {
  window.location.href = `${BACKEND_URL}/auth/google`;
};

const checkAuth = () => {
  return axios.get(`${BACKEND_URL}/auth/success`);
};

const authService = {
  logout,
  googleLogin,
  checkAuth,
};

export default authService; 