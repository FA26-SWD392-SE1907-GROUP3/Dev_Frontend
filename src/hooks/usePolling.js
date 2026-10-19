import { useCallback, useEffect, useRef, useState } from 'react';

const emptyState = { value: null, error: '', loading: false, receivedAt: null };

// Resource changes clear the previous view; refreshes retain the last successful snapshot.
export default function usePolling(fetcher, deps, enabled = true) {
  const [state, setState] = useState(emptyState);
  const refresh = useRef(null);

  useEffect(() => {
    let live = true, inFlight = false;
    setState({ ...emptyState, loading: enabled });

    async function load() {
      if (!enabled || inFlight || !live) return;
      inFlight = true;
      try {
        const value = await fetcher();
        if (live) setState({ value, error: '', loading: false, receivedAt: Date.now() });
      } catch (error) {
        if (live) setState(previous => ({ ...previous, error: error.message, loading: false }));
      } finally {
        inFlight = false;
      }
    }

    refresh.current = load;
    load();
    const timer = enabled ? setInterval(load, 5000) : null;
    return () => {
      live = false;
      refresh.current = null;
      clearInterval(timer);
    };
  }, [...deps, enabled]);

  const reload = useCallback(() => refresh.current?.(), []);
  return { ...state, reload };
}
