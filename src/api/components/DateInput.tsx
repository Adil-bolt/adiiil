import React from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = '',
  error = false,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, '');
    
    if (newValue.length > 4) {
      newValue = newValue.slice(0, 4);
    }
    
    if (newValue.length >= 2) {
      const day = parseInt(newValue.slice(0, 2));
      const month = parseInt(newValue.slice(2));
      
      if (day > 31) newValue = '31' + newValue.slice(2);
      if (month > 12) newValue = newValue.slice(0, 2) + '12';
      
      newValue = newValue.slice(0, 2) + '/' + newValue.slice(2);
    }
    
    onChange(newValue);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${className} ${
        error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
      }`}
      maxLength={5}
    />
  );
};
