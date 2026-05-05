const BASE_URL = process.env.REACT_APP_API_URL || '';

const getToken = () => localStorage.getItem('token');

const request = async (method, path, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}/api${path}`, options);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
};

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};
