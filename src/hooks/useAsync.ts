import { useCallback, useEffect, useState } from "react";

interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Runs an async fetcher on mount (and whenever deps change), exposing
 * data/isLoading/error plus a refetch() for manual retries.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []) {
  const [state, setState] = useState<UseAsyncState<T>>({ data: null, isLoading: true, error: null });

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, isLoading: false, error: err.message ?? "Something went wrong" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, refetch: run };
}
