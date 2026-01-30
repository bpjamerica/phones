const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth
export const auth = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

// Reps
export const reps = {
  getAll: () => request('/reps'),
  getAllIncludingInactive: () => request('/reps/all'),
  getById: (id) => request(`/reps/${id}`),
  create: (data) =>
    request('/reps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/reps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Calls
export const calls = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/calls${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/calls/${id}`),
  create: (data) =>
    request('/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// SMS
export const sms = {
  getHistory: (limit) =>
    request(`/sms${limit ? `?limit=${limit}` : ''}`),
};
