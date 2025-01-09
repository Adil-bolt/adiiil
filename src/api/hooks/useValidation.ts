import { useState } from 'react';

interface ValidationOptions {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useValidation(options: ValidationOptions = {}) {
  const [showValidation, setShowValidation] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const validate = (condition: boolean, message: string) => {
    if (!condition) {
      setValidationMessage(message);
      setShowValidation(true);
      options.onError?.(message);
      return false;
    }
    return true;
  };

  const clearValidation = () => {
    setShowValidation(false);
    setValidationMessage('');
  };

  const handleValidationClose = () => {
    clearValidation();
    options.onSuccess?.();
  };

  return {
    showValidation,
    validationMessage,
    validate,
    clearValidation,
    handleValidationClose
  };
}