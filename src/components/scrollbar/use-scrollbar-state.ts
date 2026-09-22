import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getScrollbarMetrics, MIN_THUMB_HEIGHT } from './scrollbar-metrics';

export type ScrollbarState = {
  visible: boolean;
  thumbHeight: number;
  thumbTop: number;
  valueNow: number;
};

export const useScrollbarState = () => {
  const { key } = useLocation();
  const [state, setState] = useState<ScrollbarState>({
    visible: false,
    thumbHeight: MIN_THUMB_HEIGHT,
    thumbTop: 0,
    valueNow: 0,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const metrics = getScrollbarMetrics(trackRef.current);
      setState({
        visible: metrics.maxScroll > 1,
        thumbHeight: metrics.thumbHeight,
        thumbTop: metrics.thumbTop,
        valueNow: metrics.valueNow,
      });
    };
    const scheduleUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    const delayedUpdate = window.setTimeout(scheduleUpdate, 0);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);
    if (trackRef.current) resizeObserver?.observe(trackRef.current);
    const main = document.querySelector('main, [class*="main__content"], [class*="main_"]');
    if (main) resizeObserver?.observe(main);
    const mutationObserver =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(scheduleUpdate);
    mutationObserver?.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        // Allow the next effect setup (StrictMode or navigation) to schedule a fresh frame.
        frameRef.current = null;
      }
      window.clearTimeout(delayedUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [key]);

  return { state, trackRef };
};
