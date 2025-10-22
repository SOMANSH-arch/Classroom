export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // <-- This is what sends the cookie
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
