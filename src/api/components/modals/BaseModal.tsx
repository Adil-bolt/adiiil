import React, { ReactNode } from 'react';
import DraggableModal from '../DraggableModal';
import { useModalEnterKey } from '../../hooks/useModalEnterKey';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  preventBackgroundClose?: boolean;
  disableEnterKey?: boolean;
}

export default function BaseModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  className,
  showCloseButton = true,
  preventBackgroundClose = false,
  disableEnterKey = false
}: BaseModalProps) {
  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      className={className}
      showCloseButton={showCloseButton}
      preventBackgroundClose={preventBackgroundClose}
      disableEnterKey={disableEnterKey}
    >
      {children}
    </DraggableModal>
  );
}