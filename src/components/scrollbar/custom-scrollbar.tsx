import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './custom-scrollbar.module.css';

const MIN_THUMB_HEIGHT = 40;

type ScrollbarState = {
  visible: boolean;
  thumbHeight: number;
  thumbTop: number;
  valueNow: number;
};

const getMetrics = (track: HTMLDivElement | null) => {
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  const viewportHeight = scrollingElement.clientHeight || window.innerHeight;
  const documentHeight = scrollingElement.scrollHeight;
  const maxScroll = Math.max(documentHeight - viewportHeight, 0);
  const trackHeight = track?.clientHeight || viewportHeight;
  const trackTop = track?.getBoundingClientRect().top ?? 0;
  const minThumbHeight = track
    ? Number.parseFloat(window.getComputedStyle(track).getPropertyValue('--thumb-min-height')) ||
      MIN_THUMB_HEIGHT
    : MIN_THUMB_HEIGHT;
  const thumbHeight =
    maxScroll > 0
      ? Math.min(
          trackHeight,
          Math.max((viewportHeight / documentHeight) * trackHeight, minThumbHeight),
        )
      : trackHeight;
  const thumbTravel = Math.max(trackHeight - thumbHeight, 0);
  const scrollTop = Math.min(Math.max(scrollingElement.scrollTop, 0), maxScroll);
  const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * thumbTravel : 0;
  const valueNow = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

  return {
    maxScroll,
    trackTop,
    thumbHeight,
    thumbTravel,
    thumbTop,
    valueNow,
  };
};

const CustomScrollbar = () => {
  const location = useLocation();
  const [state, setState] = useState<ScrollbarState>({
    visible: false,
    thumbHeight: MIN_THUMB_HEIGHT,
    thumbTop: 0,
    valueNow: 0,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; startY: number; startScrollY: number } | null>(null);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const metrics = getMetrics(trackRef.current);
      setState({
        visible: metrics.maxScroll > 1,
        thumbHeight: metrics.thumbHeight,
        thumbTop: metrics.thumbTop,
        valueNow: metrics.valueNow,
      });
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
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
        frameRef.current = null;
      }
      window.clearTimeout(delayedUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [location.key]);

  const scrollFromTrackPosition = (clientY: number) => {
    const metrics = getMetrics(trackRef.current);
    if (metrics.maxScroll <= 0 || metrics.thumbTravel <= 0) return;
    const nextThumbTop = Math.min(
      Math.max(clientY - metrics.trackTop - metrics.thumbHeight / 2, 0),
      metrics.thumbTravel,
    );
    window.scrollTo({ top: (nextThumbTop / metrics.thumbTravel) * metrics.maxScroll });
  };

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target === thumbRef.current) return;
    event.preventDefault();
    scrollFromTrackPosition(event.clientY);
  };

  const handleThumbPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollY: (document.scrollingElement ?? document.documentElement).scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleThumbPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const metrics = getMetrics(trackRef.current);
    if (metrics.maxScroll <= 0 || metrics.thumbTravel <= 0) return;
    const deltaY = event.clientY - drag.startY;
    window.scrollTo({
      top: drag.startScrollY + (deltaY / metrics.thumbTravel) * metrics.maxScroll,
    });
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const page = Math.max(window.innerHeight * 0.9, 1);
    const commands: Record<string, number> = {
      ArrowDown: 40,
      ArrowUp: -40,
      PageDown: page,
      PageUp: -page,
      ' ': event.shiftKey ? -page : page,
    };

    if (event.key === 'Home') {
      event.preventDefault();
      window.scrollTo({ top: 0 });
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      window.scrollTo({ top: getMetrics(trackRef.current).maxScroll });
      return;
    }

    const delta = commands[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    window.scrollBy({ top: delta });
  };

  return (
    <div
      ref={trackRef}
      className={[styles.track, state.visible ? styles.visible : styles.hidden].join(' ')}
      role="scrollbar"
      aria-label="Прокрутка страницы"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={state.valueNow}
      aria-hidden={!state.visible}
      tabIndex={state.visible ? 0 : -1}
      onKeyDown={handleKeyDown}
      onPointerDown={handleTrackPointerDown}
    >
      <div
        ref={thumbRef}
        className={styles.thumb}
        style={{
          height: state.thumbHeight + 'px',
          transform: 'translateY(' + state.thumbTop + 'px)',
        }}
        onPointerDown={handleThumbPointerDown}
        onPointerMove={handleThumbPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      />
    </div>
  );
};

export default CustomScrollbar;
