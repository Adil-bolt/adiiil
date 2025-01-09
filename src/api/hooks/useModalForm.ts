import { FormEvent, useCallback } from 'react';
import { useModalActions } from './useModalActions';

interface UseModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  preventBackgroundClose?: boolean;
  disableEnterKey?: boolean;
}

export function useModalForm({
  isOpen,
  onClose,
  onSubmit,
  preventBackgroundClose = false,
  disableEnterKey = false
}: UseModalFormProps) {
  const { handleConfirm, handleBackgroundClick } = useModalActions({
    isOpen,
    onClose,
    onConfirm: onSubmit,
    preventBackgroundClose,
    disableEnterKey
  });

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    handleConfirm();
  }, [handleConfirm]);

  return {
    handleSubmit,
    handleBackgroundClick
  };
}