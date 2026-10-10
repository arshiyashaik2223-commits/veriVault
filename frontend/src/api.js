const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("verivault_token");
  const headers = {...(options.headers || {})};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {...options, headers});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const api = {
  register: (body) => request("/api/auth/register", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}),
  login: (body) => request("/api/auth/login", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}),
  stats: () => request("/api/dashboard/stats"),
  evidence: (q="", category="All") => request(`/api/evidence?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
  upload: (form) => request("/api/evidence/upload", {method:"POST", body:form}),
  verify: (id) => request(`/api/evidence/${id}/verify`),
  remove: (id) => request(`/api/evidence/${id}`, {method:"DELETE"}),
};
