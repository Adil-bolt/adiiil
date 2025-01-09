import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  label?: string;
  required?: boolean;
  autoFocus?: boolean;
  onValidPassword: () => void;
}

export default function PasswordInput({
  label = "Mot de passe",
  required = false,
  autoFocus = false,
  onValidPassword
}: PasswordInputProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validatePassword();
    }
  };

  const validatePassword = () => {
    if (password === 'admin123') {
      onValidPassword();
      setPassword('');
      setError('');
    } else {
      setError('Mot de passe administrateur incorrect');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center">
          <Lock className="h-4 w-4 mr-2" />
          {label}
        </div>
      </label>
      <div className="relative mt-1">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required={required}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}