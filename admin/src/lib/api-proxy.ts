export async function adminProxy(path: string, init?: RequestInit) {
  const apiUrl = process.env.API_URL || 'http://localhost:18090';
  const token = process.env.ADMIN_TOKEN || '';
  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'x-admin-token': token, 'Content-Type': 'application/json', ...init?.headers },
  });
}
