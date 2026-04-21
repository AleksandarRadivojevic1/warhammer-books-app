import axios from 'axios';

// All requests go through the backend — never the Warhammer API directly.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

// Access token lives here in module scope, not in localStorage.
// localStorage is readable by any JS on the page (XSS risk); module scope is not.
let accessToken = null;

export const setAccessToken = (token) => { accessToken = token; };

// Attach the access token to every outgoing request.
client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, silently refresh the access token then retry the original request once.
// The CSRF token is set as a readable cookie by the server on login.
// We read it here and send it as a header — double-submit CSRF pattern.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const csrfToken =
          localStorage.getItem('csrfToken') ||
          document.cookie.split('; ').find((c) => c.startsWith('csrfToken='))?.split('=')[1];

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'x-csrf-token': csrfToken } }
        );

        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch {
        setAccessToken(null);
        // Signal AuthContext to clear user state without coupling to React directly.
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default client;
