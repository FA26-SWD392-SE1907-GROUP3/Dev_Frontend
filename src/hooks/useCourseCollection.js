import { useCallback, useEffect, useState } from 'react';

// Read only the courses returned by the authenticated user's course endpoint.
// Course selection filters these rows locally instead of gating the first load.
export default function useCourseCollection(courses, fetchCourseRows) {
  const scope = JSON.stringify(courses.items.map(({ id, code, name }) => ({ id, code, name })));
  const [version, setVersion] = useState(0);
  const [data, setData] = useState({ scope: null, items: [], loading: true, error: '' });

  useEffect(() => {
    if (courses.loading || courses.error) return;
    let current = true;
    setData({ scope, items: [], loading: true, error: '' });
    Promise.all(JSON.parse(scope).map(async course => {
      try {
        const rows = await fetchCourseRows(course.id);
        return rows.map(row => ({
          ...row,
          courseId: course.id,
          courseCode: course.code || '',
          courseName: course.name || '',
          courseLabel: [course.code, course.name].filter(Boolean).join(' — ') || course.id,
        }));
      } catch (failure) {
        throw new Error(`${course.code || course.name || 'Môn học'}: ${failure.message}`);
      }
    })).then(collections => {
      if (current) setData({ scope, items: collections.flat(), loading: false, error: '' });
    }).catch(failure => {
      if (current) setData({ scope, items: [], loading: false, error: failure.message });
    });
    return () => { current = false; };
  }, [scope, courses.loading, courses.error, fetchCourseRows, version]);

  const reload = useCallback(() => {
    if (courses.error) courses.reload?.();
    setVersion(value => value + 1);
  }, [courses.error, courses.reload]);

  const matchesScope = data.scope === scope;

  return {
    items: matchesScope && !courses.loading && !courses.error ? data.items : [],
    loading: courses.loading || (!courses.error && (!matchesScope || data.loading)),
    error: courses.error || (matchesScope ? data.error : ''),
    reload,
  };
}
