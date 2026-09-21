import { useEffect, useId, useRef, useState } from 'react';
import {
  addOpenDialog,
  canScrollWithinDialog,
  isTopmostDialog,
  removeOpenDialog,
} from './modal-scroll-lock';

const OPEN_DURATION_MS = 400;
const CLOSE_DURATION_MS = 400;

export const useModalDialog = (onClose: () => void) => {
  const ref = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openTimer = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);
  const canPointerClose = useRef(false);
  const closing = useRef(false);
  const label = useId();
  const [state, setState] = useState<'opening' | 'open' | 'closing'>('opening');

  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    setState('closing');
    closeTimer.current = window.setTimeout(onClose, CLOSE_DURATION_MS);
  };
  const requestPointerClose = () => {
    if (canPointerClose.current) requestClose();
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
    const topmost = () => isTopmostDialog(dialog);
    const onWheel = (event: WheelEvent) => {
      if (topmost() && !canScrollWithinDialog(event.target, dialog, event.deltaY))
        event.preventDefault();
    };
    const onTouchStart = (event: TouchEvent) => {
      if (topmost()) touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!topmost()) return;
      const nextY = event.touches[0]?.clientY;
      if (nextY === undefined || touchY === null) {
        event.preventDefault();
        return;
      }
      const deltaY = touchY - nextY;
      touchY = nextY;
      if (!canScrollWithinDialog(event.target, dialog, deltaY)) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!topmost()) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;
      const page = dialog.clientHeight;
      const deltas: Record<string, number> = {
        ArrowDown: 40,
        ArrowUp: -40,
        PageDown: page,
        PageUp: -page,
        Home: Number.NEGATIVE_INFINITY,
        End: Number.POSITIVE_INFINITY,
        ' ': event.shiftKey ? -page : page,
      };
      const deltaY = deltas[event.key];
      if (deltaY !== undefined && !canScrollWithinDialog(target, dialog, deltaY))
        event.preventDefault();
    };

    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      if (openFrame.current !== null) window.cancelAnimationFrame(openFrame.current);
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('keydown', onKeyDown);
      removeOpenDialog(dialog);
      dialog.close();
      priorFocus?.focus({ preventScroll: true });
    };
  }, []);

  return { ref, label, state, requestClose, requestPointerClose };
};
