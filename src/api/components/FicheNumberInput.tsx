import React, { useState, useEffect } from 'react';
import { formatFicheNumber } from '../utils/formatUtils';

interface FicheNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onEnter?: () => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export function FicheNumberInput({
  value,
  onChange,
  onBlur,
  onEnter,
  className = '',
  placeholder = 'XX-XXXX',
  required = false,
}: FicheNumberInputProps) {
  // État local pour la valeur non formatée
  const [inputValue, setInputValue] = useState('');

  // Mettre à jour l'état local quand la valeur externe change
  useEffect(() => {
    // Si la valeur est au format FXX-XXXX, la convertir en XX-XXXX
    if (value?.startsWith('F')) {
      setInputValue(value.substring(1));
    } else {
      setInputValue(value || '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // N'accepter que les chiffres et le tiret
    const cleaned = newValue.replace(/[^\d-]/g, '');
    
    // Vérifier si c'est un numéro valide
    const parts = cleaned.split('-');
    if (parts.length === 2) {
      const firstPart = parseInt(parts[0], 10);
      const secondPart = parseInt(parts[1], 10);
      
      // Ne pas accepter les numéros invalides
      if (firstPart === 0 && secondPart === 0) {
        return;
      }
      if (firstPart < 0 || secondPart < 0) {
        return;
      }
      if (firstPart > 99 || secondPart > 9999) {
        return;
      }
    }
    
    // Mettre à jour l'état local
    setInputValue(cleaned);
    
    // Formater et envoyer la valeur au parent
    const formatted = formatFicheNumber(cleaned);
    if (formatted !== '-') {
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    // Formater la valeur au format FXX-XXXX lors de la perte du focus
    const formatted = formatFicheNumber(inputValue);
    if (formatted !== '-') {
      onChange(formatted);
    } else {
      // Si le format est invalide, réinitialiser le champ
      setInputValue('');
      onChange('');
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Gérer la touche Entrée
    if (e.key === 'Enter') {
      e.preventDefault();
      // Formater la valeur
      const formatted = formatFicheNumber(inputValue);
      if (formatted !== '-') {
        onChange(formatted);
      }
      // Déclencher l'action de validation
      onEnter?.();
      return;
    }

    // N'accepter que les chiffres et le tiret
    if (!/[\d-]/.test(e.key) && 
        e.key !== 'Backspace' && 
        e.key !== 'Delete' && 
        e.key !== 'ArrowLeft' && 
        e.key !== 'ArrowRight' && 
        e.key !== 'Tab') {
      e.preventDefault();
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
      required={required}
      maxLength={9} // FXX-XXXX = 9 caractères
    />
  );
}
