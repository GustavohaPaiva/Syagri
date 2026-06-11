import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

const SHOW_DELAY_MS = 120;

const PageLoadingContext = createContext(null);

export function PageLoadingProvider({ pathKey, onLoadingChange, children }) {
  const pageLoadingRef = useRef(false);
  const overlayVisibleRef = useRef(false);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const setPageLoading = useCallback(
    (loading) => {
      pageLoadingRef.current = loading;

      if (loading) {
        clearHideTimer();

        if (overlayVisibleRef.current) {
          onLoadingChange(true);
          return;
        }

        if (showTimerRef.current) return;

        showTimerRef.current = setTimeout(() => {
          showTimerRef.current = null;
          if (!pageLoadingRef.current) return;
          overlayVisibleRef.current = true;
          onLoadingChange(true);
        }, SHOW_DELAY_MS);
        return;
      }

      clearShowTimer();

      if (!overlayVisibleRef.current) {
        onLoadingChange(false);
        return;
      }

      overlayVisibleRef.current = false;
      onLoadingChange(false);
    },
    [clearHideTimer, clearShowTimer, onLoadingChange],
  );

  useEffect(() => {
    pageLoadingRef.current = false;
    overlayVisibleRef.current = false;
    clearShowTimer();
    clearHideTimer();
  }, [pathKey, clearShowTimer, clearHideTimer]);

  const value = useMemo(() => ({ setPageLoading }), [setPageLoading]);

  return (
    <PageLoadingContext.Provider value={value}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function useSyncPageLoading(loading) {
  const ctx = useContext(PageLoadingContext);

  useEffect(() => {
    if (!ctx) return undefined;
    ctx.setPageLoading(loading);
    return () => ctx.setPageLoading(false);
  }, [loading, ctx]);
}
