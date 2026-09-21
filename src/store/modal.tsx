import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';
import { useModalDialog } from './use-modal-dialog';

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
  const { ref, label, state, requestClose, requestPointerClose } = useModalDialog(onClose);
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
