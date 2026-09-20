import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';

const OPEN_DURATION_MS = 400;
const CLOSE_DURATION_MS = 400;
const ModalCloseContext = createContext<(() => void) | null>(null);
const openedDialogs: HTMLDialogElement[] = [];
let pageScrollLock: {
  x: number;
  y: number;
  rootMinHeight: string;
  rootOverflowY: string;
  ghostScrollbar: HTMLElement | null;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
} | null = null;

const lockPageScroll = () => {
  if (pageScrollLock) return;
  const root = document.documentElement;
  const body = document.body;
  const bodyRect = body.getBoundingClientRect();
  const scrollbarWidth = Math.max(window.innerWidth - root.clientWidth, 0);
  const documentHeight = root.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(documentHeight - viewportHeight, 0);
  let ghostScrollbar: HTMLElement | null = null;

  if (scrollbarWidth > 0 && maxScroll > 0) {
    const track = document.createElement('div');
    const thumb = document.createElement('div');
    const thumbHeight = Math.max((viewportHeight / documentHeight) * viewportHeight, 28);
    const thumbTravel = Math.max(viewportHeight - thumbHeight, 0);
    const thumbTop = maxScroll > 0 ? (window.scrollY / maxScroll) * thumbTravel : 0;

    track.className = 'modal-scrollbar-ghost';
    track.style.width = scrollbarWidth + 'px';
    thumb.className = 'modal-scrollbar-ghost-thumb';
    thumb.style.height = thumbHeight + 'px';
    thumb.style.transform = 'translateY(' + thumbTop + 'px)';
    track.append(thumb);
    document.body.append(track);
    ghostScrollbar = track;
  }

  pageScrollLock = {
    x: window.scrollX,
    y: window.scrollY,
    rootMinHeight: root.style.minHeight,
    rootOverflowY: root.style.overflowY,
    ghostScrollbar,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
  };
  root.style.minHeight = root.scrollHeight + 'px';
  root.style.overflowY = 'hidden';
  body.style.position = 'fixed';
  body.style.top = bodyRect.top + 'px';
  body.style.left = bodyRect.left + 'px';
  body.style.right = 'auto';
  body.style.width = bodyRect.width + 'px';
};

const unlockPageScroll = () => {
  if (!pageScrollLock) return;
  const lock = pageScrollLock;
  pageScrollLock = null;
  const root = document.documentElement;
  const body = document.body;
  lock.ghostScrollbar?.remove();
  window.scrollTo(lock.x, lock.y);
  body.style.position = lock.bodyPosition;
  body.style.top = lock.bodyTop;
  body.style.left = lock.bodyLeft;
  body.style.right = lock.bodyRight;
  body.style.width = lock.bodyWidth;
  root.style.minHeight = lock.rootMinHeight;
  root.style.overflowY = lock.rootOverflowY;
};

const canScrollWithin = (target: EventTarget | null, dialog: HTMLDialogElement, deltaY: number) => {
  if (!(target instanceof Node) || !dialog.contains(target)) return false;
  let element = target instanceof Element ? target : target.parentElement;
  while (element) {
    const scrollable = element.scrollHeight > element.clientHeight;
    if (scrollable) {
      if (deltaY < 0 && element.scrollTop > 0) return true;
      if (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1) {
        return true;
      }
    }
    if (element === dialog) break;
    element = element.parentElement;
  }
  return false;
};

export const ModalDismissButton = ({ onClick, ...props }: ComponentPropsWithoutRef<'button'>) => {
  const requestClose = useContext(ModalCloseContext);
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) requestClose?.();
      }}
    />
  );
};

const Modal = ({
  title,
  onClose,
  children,
  className = '',
}: PropsWithChildren<{ title: string; onClose: () => void; className?: string }>) => {
  const ref = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openTimer = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);
  const canClose = useRef(false);
  const label = useId();
  const [state, setState] = useState<'opening' | 'open' | 'closing'>('opening');

  const requestClose = () => {
    if (state === 'closing') return;
    setState('closing');
    closeTimer.current = window.setTimeout(onClose, CLOSE_DURATION_MS);
  };
  const requestGuardedClose = () => {
    if (!canClose.current) return;
    requestClose();
  };

  useEffect(() => {
    const dialog = ref.current;
    const priorFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    if (dialog) openedDialogs.push(dialog);
    if (openedDialogs.length === 1) lockPageScroll();
    openFrame.current = window.requestAnimationFrame(() => {
      setState('open');
      openTimer.current = window.setTimeout(() => {
        canClose.current = true;
      }, OPEN_DURATION_MS);
    });

    let touchY: number | null = null;
    const isTopmost = () => openedDialogs.at(-1) === dialog;
    const preventBackgroundWheel = (event: WheelEvent) => {
      if (!dialog || !isTopmost()) return;
      if (!canScrollWithin(event.target, dialog, event.deltaY)) event.preventDefault();
    };
    const rememberTouch = (event: TouchEvent) => {
      if (!isTopmost()) return;
      touchY = event.touches[0]?.clientY ?? null;
    };
    const preventBackgroundTouch = (event: TouchEvent) => {
      if (!dialog || !isTopmost()) return;
      const nextY = event.touches[0]?.clientY;
      if (nextY === undefined || touchY === null) {
        event.preventDefault();
        return;
      }
      const deltaY = touchY - nextY;
      touchY = nextY;
      if (!canScrollWithin(event.target, dialog, deltaY)) event.preventDefault();
    };
    const preventBackgroundKeys = (event: KeyboardEvent) => {
      if (!dialog || !isTopmost()) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      const deltas: Record<string, number> = {
        ArrowDown: 40,
        ArrowUp: -40,
        PageDown: dialog.clientHeight,
        PageUp: -dialog.clientHeight,
        Home: Number.NEGATIVE_INFINITY,
        End: Number.POSITIVE_INFINITY,
        ' ': event.shiftKey ? -dialog.clientHeight : dialog.clientHeight,
      };
      const deltaY = deltas[event.key];
      if (deltaY === undefined) return;
      if (!canScrollWithin(target, dialog, deltaY)) event.preventDefault();
    };

    document.addEventListener('wheel', preventBackgroundWheel, { passive: false });
    document.addEventListener('touchstart', rememberTouch, { passive: true });
    document.addEventListener('touchmove', preventBackgroundTouch, { passive: false });
    document.addEventListener('keydown', preventBackgroundKeys);

    return () => {
      if (openFrame.current !== null) window.cancelAnimationFrame(openFrame.current);
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      document.removeEventListener('wheel', preventBackgroundWheel);
      document.removeEventListener('touchstart', rememberTouch);
      document.removeEventListener('touchmove', preventBackgroundTouch);
      document.removeEventListener('keydown', preventBackgroundKeys);
      if (dialog) {
        const index = openedDialogs.lastIndexOf(dialog);
        if (index !== -1) openedDialogs.splice(index, 1);
      }
      if (!openedDialogs.length) unlockPageScroll();
      dialog?.close();
      priorFocus?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      className={'modal' + (className ? ' ' + className : '')}
      data-state={state}
      aria-labelledby={label}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) requestGuardedClose();
      }}
    >
      <ModalCloseContext.Provider value={requestClose}>
        <div className="modal-content">
          <button
            type="button"
            className="close"
            aria-label="Закрыть окно"
            onClick={requestGuardedClose}
          >
            ×
          </button>
          <p className="eyebrow">Stitches &amp; Stories</p>
          <h2 id={label}>{title}</h2>
          {children}
        </div>
      </ModalCloseContext.Provider>
    </dialog>,
    document.body,
  );
};

export default Modal;
