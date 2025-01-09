import { useState } from 'react';

interface UsePaymentAmountProps {
  initialAmount?: string;
  onAmountChange?: (amount: string, paymentMethod: string) => void;
}

export const usePaymentAmount = (props?: UsePaymentAmountProps) => {
  const { initialAmount = '0,00', onAmountChange } = props || {};
  
  const [amount, setAmount] = useState(
    initialAmount === '0,00' || !initialAmount ? '- Dhs' : `${initialAmount} Dhs`
  );

  const handleAmountChange = (value: string) => {
    // Ne garder que les chiffres et la virgule
    value = value.replace(' Dhs', '').trim();
    value = value.replace(/[^0-9,]/g, '');
    
    // S'assurer qu'il n'y a qu'une seule virgule
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts[1];
    }
    
    // Si la valeur est vide, mettre '-'
    if (!value) {
      setAmount('- Dhs');
      onAmountChange?.('-', '-');
      return '-';
    }
    
    setAmount(`${value} Dhs`);
    onAmountChange?.(value, value === '0,00' ? '-' : 'default');
    return value;
  };

  const handleAmountFocus = () => {
    // Toujours vider le champ au focus
    setAmount('');
    onAmountChange?.('', '-');
    return '';
  };

  const handleAmountBlur = () => {
    let value = amount.replace(' Dhs', '').trim();
    
    // Si vide ou invalide, mettre '-'
    if (!value || value === '0,00') {
      setAmount('- Dhs');
      onAmountChange?.('-', '-');
      return;
    }
    
    // Ajouter ',00' si pas de décimales
    if (!value.includes(',')) {
      value = value + ',00';
    }
    
    setAmount(`${value} Dhs`);
    onAmountChange?.(value, value === '0,00' ? '-' : 'default');
  };

  const formatDisplayAmount = (value: string) => {
    if (!value || value === '-') return '- Dhs';
    return `${value} Dhs`;
  };

  return {
    amount,
    handleAmountChange,
    handleAmountFocus,
    handleAmountBlur,
    formatDisplayAmount
  };
};
