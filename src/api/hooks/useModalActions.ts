import { useCallback } from 'react';
import { useModalEnterKey } from './useModalEnterKey';

interface UseModalActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  preventBackgroundClose?: boolean;
  disableEnterKey?: boolean;
}

export function useModalActions({
  isOpen,
  onClose,
  onConfirm,
  preventBackgroundClose = false,
  disableEnterKey = false
}: UseModalActionsProps) {
  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  }, [onConfirm, onClose]);

  useModalEnterKey({
    isOpen,
    onEnter: handleConfirm,
    onEscape: preventBackgroundClose ? undefined : onClose,
    disabled: disableEnterKey
  });

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventBackgroundClose) {
      onClose();
    }
  };

  return {
    handleConfirm,
    handleBackgroundClick
  };
}