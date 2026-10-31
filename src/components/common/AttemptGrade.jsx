import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui';

export default function AttemptGrade({ attemptId }) {
  const [grade, setGrade] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [retrying, setRetrying] = useState(false);

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
        if (['PENDING', 'RUNNING'].includes(value.status)) timer = setTimeout(load, 5000);
      } catch (failure) {
        if (active) setError(failure.message);
      }
    }
    load();
    return () => { active = false; clearTimeout(timer); };
  }, [attemptId, revision]);

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

  return <section className="space-y-3 rounded-xl border border-appborder bg-surface p-4" aria-label="Kết quả chấm toàn bài">
    <h3 className="font-semibold">Kết quả AI chấm toàn bài</h3>
    <p className="text-sm text-mutedtext">Một rubric chung được áp dụng cho toàn bộ câu hỏi và câu trả lời sau khi lượt thi kết thúc.</p>
    {error && <><p role="alert" className="text-danger-text">{error}</p><Button variant="secondary" onClick={() => setRevision(value => value + 1)}>Tải lại kết quả</Button></>}
    {!grade && !error && <p role="status">Đang tải kết quả chấm bài...</p>}
    {['PENDING', 'RUNNING'].includes(grade?.status) && <p role="status">{grade.status === 'RUNNING' ? 'AI đang chấm toàn bộ bài thi...' : 'Bài thi đã hoàn tất và đang chờ AI chấm.'}</p>}
    {grade?.status === 'NOT_STARTED' && <p>AI sẽ chấm sau khi hoàn thành toàn bộ lượt thi.</p>}
    {grade?.status === 'UNAVAILABLE' && <p>Lượt thi cũ chưa có rubric chấm toàn bài.</p>}
    {grade?.status === 'FAILED' && <><p role="alert">{grade.error || 'Chưa chấm được bài thi.'}</p><Button variant="secondary" disabled={retrying} onClick={retry}>{retrying ? 'Đang gửi yêu cầu...' : 'Thử chấm lại'}</Button></>}
    {grade?.result && <>
      <p className="text-xl font-semibold">{grade.result.totalScore} / {grade.result.maxScore} điểm</p>
      <p className="whitespace-pre-wrap">{grade.result.feedback}</p>
      <ul className="space-y-3">{grade.result.criteria.map(criterion => <li key={criterion.sortOrder} className="rounded-lg border border-appborder p-3"><p className="font-medium">{criterion.name}: {criterion.score} / {criterion.maxPoints}</p><p className="whitespace-pre-wrap text-sm">{criterion.feedback}</p></li>)}</ul>
    </>}
  </section>;
}
