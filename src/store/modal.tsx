import { useEffect, useId, useRef, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
let openedDialogs = 0;
const Modal = ({
  title,
  onClose,
  children,
  className = '',
}: PropsWithChildren<{ title: string; onClose: () => void; className?: string }>) => {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  useEffect(() => {
    const dialog = ref.current;
    const priorFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    openedDialogs += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      openedDialogs -= 1;
      if (!openedDialogs) document.body.style.overflow = '';
      priorFocus?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={'modal' + (className ? ' ' + className : '')}
      aria-labelledby={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-content">
        <button type="button" className="close" aria-label="Закрыть окно" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">Stitches &amp; Stories</p>
        <h2 id={label}>{title}</h2>
        {children}
      </div>
    </dialog>,
    document.body,
  );
};
export default Modal;
