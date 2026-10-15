const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let bearerToken = null;
export function setToken(token) { bearerToken = token; }
export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
export async function request(path, { body, responseType, timeoutMs = 120000, ...options } = {}) {
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
      headers: { ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}), ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}), ...options.headers },
      ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') throw new ApiError('Máy chủ phản hồi quá lâu. Vui lòng tải lại hoặc kiểm tra backend.', 0);
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Không kết nối được máy chủ. Vui lòng thử lại.', 0);
  }
  if (!response.ok) {
    if (response.status === 401 && bearerToken && !path.startsWith('/auth/login') && !path.startsWith('/auth/google') && typeof window !== 'undefined') window.dispatchEvent(new Event('aives:unauthorized'));
    const problem = await response.json().catch(() => null);
    if (response.status === 503 && problem?.detail?.includes('Configure AI_MODEL')) throw new ApiError('Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để bật sinh câu hỏi và hỏi đào sâu.', 503);
    throw new ApiError(problem?.errors?.join('; ') || problem?.detail || problem?.message || `Yêu cầu thất bại (${response.status}).`, response.status);
  }
  if (response.status === 204) return null;
  if (responseType === 'blob') return response.blob();
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
export async function allSubjects(signal) {
  const items = []; let page = 0; let result;
  do { result = await subjectsApi.list(page++, signal); items.push(...result.content); } while (page < result.totalPages);
  return items;
}
export async function download(path, filename) {
  const blob = await request(path, { responseType: 'blob' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
export const subjectsApi = {
  list: (page = 0, signal) => request(`/subjects?page=${page}&size=20&sort=subjectId,asc`, { signal, timeoutMs: 15000 }),
  get: (id) => request(`/subjects/${id}`),
  create: (body) => request('/subjects', { method: 'POST', body }),
  update: (id, body) => request(`/subjects/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
};
