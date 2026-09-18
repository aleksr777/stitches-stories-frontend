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

const CLOSE_DURATION_MS = 400;
const ModalCloseContext = createContext<(() => void) | null>(null);

export const ModalDismissButton = ({
  onClick,
  ...props
}: ComponentPropsWithoutRef<'button'>) => {
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
  const openFrame = useRef<number | null>(null);
  const label = useId();
  const [state, setState] = useState<'opening' | 'open' | 'closing'>('opening');

  const requestClose = () => {
    if (state === 'closing') return;
    setState('closing');
    closeTimer.current = window.setTimeout(onClose, CLOSE_DURATION_MS);
  };

  useEffect(() => {
    const dialog = ref.current;
    const priorFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    openFrame.current = window.requestAnimationFrame(() => setState('open'));

    return () => {
      if (openFrame.current !== null) window.cancelAnimationFrame(openFrame.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      dialog?.close();
      priorFocus?.focus();
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
        if (e.target === ref.current) requestClose();
      }}
    >
      <ModalCloseContext.Provider value={requestClose}>
        <div className="modal-content">
          <button type="button" className="close" aria-label="Закрыть окно" onClick={requestClose}>
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
