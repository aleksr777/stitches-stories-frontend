export const MIN_THUMB_HEIGHT = 40;

const getViewportHeight = () =>
  Math.max(window.visualViewport?.height ?? window.innerHeight, 1);

const getDocumentHeight = () => {
  const root = document.documentElement;
  const body = document.body;
  return Math.max(
    root.scrollHeight,
    root.offsetHeight,
    root.clientHeight,
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    body?.clientHeight ?? 0,
  );
};

export const getScrollbarMetrics = (track: HTMLDivElement | null) => {
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  const viewportHeight = getViewportHeight();
  const documentHeight = getDocumentHeight();
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
  const scrollTop = Math.min(
    Math.max(window.scrollY || scrollingElement.scrollTop, 0),
    maxScroll,
  );
  return {
    maxScroll,
    trackTop,
    thumbHeight,
    thumbTravel,
    thumbTop: maxScroll > 0 ? (scrollTop / maxScroll) * thumbTravel : 0,
    valueNow: maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0,
  };
};
