// Spring Boot controllers in the uploaded Dev_Backend.zip use /api/v1.
// On Vite dev server /api/v1 is proxied to http://localhost:8080.
const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
let bearerToken = null;
export function setToken(token) { bearerToken = token || null; }
export function interviewSocketUrl(ticket) {
  const url = new URL(`${baseUrl}/interviews/live`, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('ticket', ticket);
  return url.toString();
}
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ApiError'; this.status = status; }
}
function serverMessage(problem, status) {
  if (Array.isArray(problem?.errors)) return problem.errors.join('; ');
  const message = problem?.detail || problem?.message || problem?.error;
  if (message === 'Not assigned to this course') return 'Bạn chưa được phân công môn học này. Hãy liên hệ quản trị viên để được phân công.';
  if (message === 'Student not enrolled') return 'Sinh viên chưa được ghi danh vào môn này. Nhờ Admin cập nhật tại Môn học & sinh viên trước khi phân lịch.';
  if (problem === 'Invalid CORS request') return 'Backend chưa cho phép địa chỉ trang web này. Hãy kiểm tra CORS_ALLOWED_ORIGINS hoặc mở trang qua http://localhost:3000.';
  if (!message && status === 403) return 'Máy chủ từ chối quyền truy cập. Hãy đăng nhập lại bằng tài khoản sinh viên được phân lịch; nếu vẫn lỗi, nhờ giảng viên kiểm tra ghi danh môn học.';
  return message || `Yêu cầu thất bại (HTTP ${status}).`;
}
export async function request(path, { body, responseType, rawBody = false, timeoutMs = 30000, ...options } = {}) {
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  const timeout = AbortSignal.timeout(timeoutMs);
  let signal = timeout;
  if (options.signal) signal = AbortSignal.any([options.signal, timeout]);
  const requestToken = bearerToken;
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options, signal,
      headers: { ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}), ...options.headers },
      ...(body !== undefined ? { body: multipart || rawBody ? body : JSON.stringify(body) } : {}),
    });
    if (response.status === 401 && requestToken && bearerToken === requestToken && !path.startsWith('/auth/login') && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('aives:unauthorized'));
    }
    if (responseType === 'blob' && response.ok) return await response.blob();

    const raw = await response.text();
    let result = null;
    if (raw) { try { result = JSON.parse(raw); } catch { result = raw; } }
    if (!response.ok) throw new ApiError(serverMessage(result, response.status), response.status);
    // Only unwrap ApiResponse<T>; direct controller records, arrays and UUIDs stay untouched.
    if (result && !Array.isArray(result) && typeof result === 'object' && 'data' in result && 'code' in result) return result.data;
    return result;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (options.signal?.aborted) throw e;
    if (timeout.aborted || e.name === 'TimeoutError') throw new ApiError('Máy chủ phản hồi quá lâu, hãy kiểm tra Spring Boot.', 0);
    throw new ApiError('Không kết nối được Spring Boot. Kiểm tra backend trên cổng 8080 và Vite proxy.', 0);
  }
}

export function decodeJwt(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data.sub || !['ADMIN', 'LECTURER', 'STUDENT'].includes(data.role)) return null;
    if (data.exp && Date.now() >= data.exp * 1000) return null;
    // Decoding is presentation only. Backend is responsible for JWT verification.
    return { id: data.sub, email: data.email, role: data.role };
  } catch { return null; }
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (id) => request(`/users/${encodeURIComponent(id)}`),
  users: () => request('/users'),
  createUser: body => request('/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PUT', body }),
  deleteUser: id => request(`/users/${id}`,{method:'DELETE'}),
  changePassword: (id, body) => request(`/users/${id}/password`, {method: 'PUT', body}),
  setUserActive: (id, active) => request(`/users/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' }),
  courses: lecturerId => request(`/courses${lecturerId?`?lecturerId=${encodeURIComponent(lecturerId)}`:''}`),
  createCourse: body => request('/courses', { method: 'POST', body }),
  updateCourse: (id,body) => request(`/courses/${id}`,{method:'PUT',body}),
  deleteCourse: id => request(`/courses/${id}`,{method:'DELETE'}),
  restoreCourse: id => request(`/courses/${id}/restore`,{method:'PATCH'}),
  removeLecturer: (id,lecturerId) => request(`/courses/${id}/lecturers/${lecturerId}`,{method:'DELETE'}),
  replaceLecturer: (id,lecturerId,email) => request(`/courses/${id}/lecturers/${lecturerId}`,{method:'PUT',body:{email}}),
  dropStudent: (id,studentId) => request(`/courses/${id}/students/${studentId}`,{method:'DELETE'}),
  assignLecturer: (id, email) => request(`/courses/${id}/lecturers`, { method: 'POST', body: { email } }),
  courseLecturers: id => request(`/courses/${id}/lecturers`),
  enrollStudent: (id, email) => request(`/courses/${id}/students`, { method: 'POST', body: { email } }),
  courseStudents: id => request(`/courses/${id}/students`),
  rubrics: id => request(`/courses/${id}/rubrics`),
  createRubric: body => request('/rubrics', { method: 'POST', body }),
  updateRubric: (id,body) => request(`/rubrics/${id}`,{method:'PUT',body}),
  deleteRubric: id => request(`/rubrics/${id}`,{method:'DELETE'}),
  addCriterion: (id, body) => request(`/rubrics/${id}/criteria`, { method: 'POST', body }),
  criteria: id => request(`/rubrics/${id}/criteria`),
  updateCriterion: (id, criterionId, body) => request(`/rubrics/${id}/criteria/${criterionId}`, { method: 'PUT', body }),
  deleteCriterion: (id, criterionId) => request(`/rubrics/${id}/criteria/${criterionId}`, { method: 'DELETE' }),
  publishRubric: id => request(`/rubrics/${id}/publish`, { method: 'PATCH' }),
  materials: id => request(`/courses/${id}/materials`),
  uploadMaterial: (id, file) => { const body = new FormData(); body.append('file', file); return request(`/courses/${id}/materials`, { method: 'POST', body, timeoutMs: 120000 }); },
  renameMaterial: (id,name) => request(`/materials/${id}`,{method:'PUT',body:{name}}),
  deleteMaterial: id => request(`/materials/${id}`,{method:'DELETE'}),
  downloadMaterial: id => request(`/materials/${id}/download`, { responseType: 'blob' }),
  indexMaterial: id => request(`/materials/${id}/index`, { method: 'POST', timeoutMs: 120000 }),
  materialChunks: id => request(`/materials/${id}/chunks`),
  aiStatus: () => request('/ai/status'),
  generationJobs: id => request(`/courses/${id}/generation-jobs`),
  generationQuestions: id => request(`/generation-jobs/${id}/questions`),
  generateQuestions: (id, body) => request(`/courses/${id}/generation-jobs`, { method: 'POST', body, timeoutMs: 120000 }),
  questions: id => request(`/courses/${id}/questions`),
  question: id => request(`/questions/${id}`),
  createQuestion: body => request('/questions', { method: 'POST', body }),
  importQuestions: (courseId, file, rubricId, preview=true) => { const body=new FormData(); body.append('file',file); if(rubricId)body.append('rubricId',rubricId);body.append('preview',String(preview));return request(`/courses/${courseId}/question-imports`,{method:'POST',body,timeoutMs:120000}); },
  updateQuestion: (id, body) => request(`/questions/${id}`, { method: 'PUT', body }),
  deleteQuestion: id => request(`/questions/${id}`, { method: 'DELETE' }),
  reviewQuestion: (id, approve, comment = '') => request(`/questions/${id}/review?approve=${approve}`, { method: 'PATCH', body: comment, rawBody: true, headers: { 'Content-Type': 'text/plain' } }),
  createExam: body => request('/exams', { method: 'POST', body }),
  exam: id => request(`/exams/${id}`),
  exams: () => request('/exams'),
  updateExam: (id, body) => request(`/exams/${id}`, { method: 'PUT', body }),
  deleteExam: id => request(`/exams/${id}`,{method:'DELETE'}),
  examPool: id => request(`/exams/${id}/questions`),
  removeExamQuestion: (id, questionId) => request(`/exams/${id}/questions/${questionId}`, { method: 'DELETE' }),
  examCandidates: id => request(`/exams/${id}/candidates`),
  examMonitor: id => request(`/exams/${id}/monitor`),
  examTranscript: (examId,attemptId) => request(`/exams/${examId}/attempts/${attemptId}/transcript`),
  examRecording: (examId,attemptId,turnId) => request(`/exams/${examId}/attempts/${attemptId}/audio/${turnId}`,{responseType:'blob'}),
  rescheduleCandidate: (id, candidateId, body) => request(`/exams/${id}/candidates/${candidateId}`, { method: 'PUT', body }),
  removeCandidate: (id, candidateId) => request(`/exams/${id}/candidates/${candidateId}`, { method: 'DELETE' }),
  addExamQuestion: (id, questionId) => request(`/exams/${id}/questions`, { method: 'POST', body: { questionId } }),
  assignCandidate: (id, body) => request(`/exams/${id}/candidates`, { method: 'POST', body }),
  activateExam: id => request(`/exams/${id}/activate`, { method: 'PATCH' }),
  closeExam: id => request(`/exams/${id}/close`, { method: 'PATCH' }),
  studentExams: () => request('/student/exams'),
  studentAttempts: candidateId => request(`/student/exams/${encodeURIComponent(candidateId)}/attempts`),
  startAttempt: candidateId => request(`/attempts/start/${candidateId}`, { method: 'POST' }),
  attemptQuestions: attemptId => request(`/attempts/${attemptId}/questions`),
  interview: id => request(`/interviews/${id}`),
  beginInterviewAnswer: (id, promptId) => request(`/interviews/${id}/begin`, { method: 'POST', body: { promptId } }),
  interviewAnswer: (id, promptId, text) => request(`/interviews/${id}/answers`, { method: 'POST', body: { promptId, text }, timeoutMs: 120000 }),
  interviewAudioAnswer: (id, promptId, file) => { const body = new FormData(); body.append('promptId', promptId); body.append('file', file); return request(`/interviews/${id}/audio-answers`, { method: 'POST', body, timeoutMs: 150000 }); },
  continueInterview: (id, answerTurnId) => request(`/interviews/${id}/continue`, { method: 'POST', body: { answerTurnId }, timeoutMs: 120000 }),
  timeoutInterview: (id, promptId) => request(`/interviews/${id}/timeout`, { method: 'POST', body: { promptId } }),
  interviewSpeech: (id, turnId) => request(`/interviews/${id}/speech/${turnId}`, { responseType: 'blob', timeoutMs: 180000 }),
  interviewAudio: (id, turnId) => request(`/interviews/${id}/audio/${turnId}`, { responseType: 'blob' }),
  interviewLiveTicket: (id, promptId) => request(`/interviews/${id}/live-ticket`, { method: 'POST', body: { promptId } }),
  submitAnswer: (assignedQuestionId, text) => request(`/attempts/questions/${assignedQuestionId}/answer`, { method: 'POST', body: { text } }),
};
