import { api } from './api';

export async function getSession() {
  try {
    return (await api('/api/auth/me')).user;
  } catch {
    return null;
  }
}
