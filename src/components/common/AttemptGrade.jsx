import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui';

export default function AttemptGrade({ attemptId, lecturer = false }) {
  const [grade, setGrade] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [scoreDraft, setScoreDraft] = useState(null);
  const [feedbackDraft, setFeedbackDraft] = useState(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    setScoreDraft(null);
    setFeedbackDraft(null);
  }, [attemptId]);

  useEffect(() => {
    let active = true;
    let timer;
    setGrade(null);
    setError('');
    async function load() {
      try {
        const value = await api.attemptGrade(attemptId);
        if (!active) return;
        setGrade(value);
        setError('');
        if (lecturer ? ['PENDING', 'RUNNING'].includes(value.status) : !value.published && value.status !== 'NOT_STARTED') {
          timer = setTimeout(load, lecturer ? 5000 : 10000);
        }
      } catch (failure) {
        if (active) setError(failure.message);
      }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [attemptId, revision, lecturer]);

  async function retry() {
    setRetrying(true);
    setError('');
    try {
      await api.retryAttemptGrade(attemptId);
      setRevision(value => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setRetrying(false);
    }
  }

  const maxScore = grade?.maxScore ?? grade?.result?.maxScore;
  const score = scoreDraft ?? grade?.result?.totalScore ?? '';
  const feedback = feedbackDraft ?? '';
  async function publish(event) {
    event.preventDefault();
    setPublishing(true);
    setError('');
    try {
      const updated = await api.publishAttemptGrade(attemptId, { score: Number(score), feedback: feedback.trim() });
      if (!updated?.published) {
        setError('Máy chủ chưa xác nhận công bố điểm. Hãy tải lại kết quả để kiểm tra trước khi thử lại.');
        return;
      }
      setGrade(updated);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPublishing(false);
    }
  }

  return <section className="space-y-3 rounded-xl border border-appborder bg-surface p-4" aria-label="Kết quả chấm toàn bài">
    <h3 className="font-semibold">{lecturer ? 'Duyệt kết quả chấm toàn bài' : 'Kết quả bài thi'}</h3>
    {error && <><p role="alert" className="text-danger-text">{error}</p><Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Tải lại kết quả</Button></>}
    {!grade && !error && <p role="status">Đang tải kết quả chấm bài...</p>}
    {!lecturer && grade && !grade.published && <p role="status">Giảng viên chưa công bố điểm và nhận xét.</p>}
    {lecturer && ['PENDING', 'RUNNING'].includes(grade?.status) && <p role="status">{grade.status === 'RUNNING' ? 'AI đang chấm toàn bộ bài thi...' : 'Bài thi đã hoàn tất và đang chờ AI chấm.'}</p>}
    {lecturer && grade?.status === 'NOT_STARTED' && <p>AI sẽ chấm sau khi hoàn thành toàn bộ lượt thi.</p>}
    {lecturer && grade && !grade.published && grade.status !== 'NOT_STARTED' && !maxScore &&
      <p role="status">Chưa có thang điểm rubric để công bố kết quả.</p>}
    {lecturer && !grade?.published && grade?.status === 'FAILED' && <><p role="alert">{grade.error || 'Chưa chấm được bài thi.'}</p><Button variant="secondary" disabled={retrying} onClick={retry}>{retrying ? 'Đang gửi yêu cầu...' : 'Thử chấm lại'}</Button></>}
    {lecturer && grade?.result && <>
      <h4 className="font-medium">Điểm AI đề xuất</h4>
      <p className="text-xl font-semibold">{grade.result.totalScore} / {grade.result.maxScore} điểm</p>
      <p className="whitespace-pre-wrap">{grade.result.feedback}</p>
      <ul className="space-y-3">{grade.result.criteria.map(criterion => <li key={criterion.sortOrder} className="rounded-lg border border-appborder p-3"><p className="font-medium">{criterion.name}: {criterion.score} / {criterion.maxPoints}</p><p className="whitespace-pre-wrap text-sm">{criterion.feedback}</p></li>)}</ul>
    </>}
    {lecturer && grade && maxScore && !grade.published && grade.status !== 'NOT_STARTED' &&
      <form className="space-y-3 border-t border-appborder pt-3" onSubmit={publish}>
        <label className="block">Điểm chốt (tối đa {maxScore})
          <input className="mt-1 block rounded border border-appborder bg-surface p-2" aria-label="Điểm chốt" type="number"
            min="0" max={maxScore} step="0.01" required value={score} onChange={event => setScoreDraft(event.target.value)} />
        </label>
        <label className="block">Nhận xét của giảng viên
          <textarea className="mt-1 block w-full rounded border border-appborder bg-surface p-2" aria-label="Nhận xét của giảng viên"
            rows={4} required maxLength={4000} value={feedback} onChange={event => setFeedbackDraft(event.target.value)} />
        </label>
        <p className="text-sm">Nhập nhận xét của giảng viên để công bố điểm cho thí sinh.</p>
        <Button type="submit" disabled={publishing || score === '' || !feedback.trim()}>{publishing ? 'Đang công bố...' : 'Chốt và công bố điểm'}</Button>
      </form>}
    {grade?.published && <>
      {lecturer && <h4 role="status" className="font-medium">Điểm đã công bố cho thí sinh</h4>}
      <p className="text-xl font-semibold">{grade.published.score} / {grade.published.maxScore} điểm</p>
      <p className="whitespace-pre-wrap">{grade.published.feedback}</p>
    </>}
  </section>;
}
