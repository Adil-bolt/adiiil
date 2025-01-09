import React, { useState } from 'react';

interface YearInputProps {
  value: string;
  onChange: (year: string) => void;
  className?: string;
  onEnter?: () => void;
  id?: string;
  label?: string;
}

export const YearInput: React.FC<YearInputProps> = ({
  value,
  onChange,
  className = '',
  onEnter,
  id,
  label
}) => {
  const [inputValue, setInputValue] = useState(value || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, ''); // N'accepter que les chiffres
    
    if (newValue.length <= 4) {
      setInputValue(newValue);
      
      // Si nous avons une année complète
      if (newValue.length === 4) {
        const year = parseInt(newValue);
        if (year >= 1900 && year <= 2100) {
          onChange(newValue);
        }
      } else if (newValue.length === 0) {
        onChange('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.length === 4) {
        const year = parseInt(inputValue);
        if (year >= 1900 && year <= 2100) {
          onChange(inputValue);
          e.currentTarget.blur(); // Enlève le focus
          if (onEnter) onEnter();
        } else {
          // Animation si l'année est invalide
          const input = e.currentTarget;
          input.classList.add('shake-animation');
          setTimeout(() => {
            input.classList.remove('shake-animation');
          }, 500);
        }
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.length === 4) {
      const year = parseInt(inputValue);
      if (year >= 1900 && year <= 2100) {
        onChange(inputValue);
      } else {
        setInputValue(value || '');
      }
    } else if (inputValue.length > 0) {
      setInputValue(value || '');
    } else {
      onChange('');
    }
  };

  return (
    <div className="flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="AAAA"
        maxLength={4}
        id={id}
        className={`${className} px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
      />
    </div>
  );
};
