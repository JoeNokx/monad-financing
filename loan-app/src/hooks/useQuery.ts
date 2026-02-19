import { useEffect, useState } from 'react';

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useQuery<T>(fn: () => Promise<T>, deps: any[]) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ data: null, error: null, loading: true });
      try {
        const data = await fn();
        if (!cancelled) setState({ data, error: null, loading: false });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong';
        if (!cancelled) setState({ data: null, error: message, loading: false });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
