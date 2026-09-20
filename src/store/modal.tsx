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
import {
  addOpenDialog,
  canScrollWithinDialog,
  isTopmostDialog,
  removeOpenDialog,
} from './modal-scroll-lock';

const OPEN_DURATION_MS = 400;
const CLOSE_DURATION_MS = 400;
const ModalCloseContext = createContext<(() => void) | null>(null);

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
  const canPointerClose = useRef(false);
  const label = useId();
  const [state, setState] = useState<'opening' | 'open' | 'closing'>('opening');

  const requestClose = () => {
    if (state === 'closing') return;
    setState('closing');
    closeTimer.current = window.setTimeout(onClose, CLOSE_DURATION_MS);
  };

  const requestPointerClose = () => {
    if (!canPointerClose.current) return;
    requestClose();
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const priorFocus = document.activeElement as HTMLElement | null;
    dialog.showModal();
    addOpenDialog(dialog);
    openFrame.current = window.requestAnimationFrame(() => {
      setState('open');
      openTimer.current = window.setTimeout(() => {
        canPointerClose.current = true;
      }, OPEN_DURATION_MS);
    });

    let touchY: number | null = null;
    const isTopmost = () => isTopmostDialog(dialog);
    const preventBackgroundWheel = (event: WheelEvent) => {
      if (!isTopmost()) return;
      if (!canScrollWithinDialog(event.target, dialog, event.deltaY)) event.preventDefault();
    };
    const rememberTouch = (event: TouchEvent) => {
      if (!isTopmost()) return;
      touchY = event.touches[0]?.clientY ?? null;
    };
    const preventBackgroundTouch = (event: TouchEvent) => {
      if (!isTopmost()) return;
      const nextY = event.touches[0]?.clientY;
      if (nextY === undefined || touchY === null) {
        event.preventDefault();
        return;
      }
      const deltaY = touchY - nextY;
      touchY = nextY;
      if (!canScrollWithinDialog(event.target, dialog, deltaY)) event.preventDefault();
    };
    const preventBackgroundKeys = (event: KeyboardEvent) => {
      if (!isTopmost()) return;
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
      if (!canScrollWithinDialog(target, dialog, deltaY)) event.preventDefault();
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
      removeOpenDialog(dialog);
      dialog.close();
      priorFocus?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      className={'modal' + (className ? ' ' + className : '')}
      data-state={state}
      aria-labelledby={label}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) requestPointerClose();
      }}
    >
      <ModalCloseContext.Provider value={requestClose}>
        <div className="modal-content">
          <button
            type="button"
            className="close"
            aria-label="Закрыть окно"
            onClick={requestPointerClose}
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
