import { useEffect, useState } from 'react';
import { api } from './model';
export function useRemote(path) {
  const [state, setState] = useState({ loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    api
      .request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ error, loading: false });
      });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, reload: () => setVersion((n) => n + 1) };
}
