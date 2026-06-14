const API_BASE = import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_BASE_URL ?? "";

function getToken() {
  return localStorage.getItem("client_jwt");
}

function setToken(token) {
  if (token) localStorage.setItem("client_jwt", token);
  else localStorage.removeItem("client_jwt");
}

async function clientFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    // Try refresh
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${getToken()}`;
      const retryResp = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (retryResp.ok) return retryResp.json();
    }
    setToken(null);
    window.location.href = "/client/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function tryRefresh() {
  const token = getToken();
  if (!token) return false;
  try {
    const resp = await fetch(`${API_BASE}/api/v1/client/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      setToken(data.access_token);
      return true;
    }
  } catch {}
  return false;
}

export const clientApi = {
  get: (path) => clientFetch(path),
  post: (path, body, extraHeaders = {}) => clientFetch(path, {
    method: "POST",
    headers: { ...extraHeaders },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }),
  put: (path, body) => clientFetch(path, { method: "PUT", body: JSON.stringify(body) }),
};

export { getToken, setToken };
