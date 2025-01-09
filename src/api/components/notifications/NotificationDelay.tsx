import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface NotificationDelayProps {
  defaultValue?: number;
  onChange: (hours: number) => void;
}

export default function NotificationDelay({ defaultValue = 48, onChange }: NotificationDelayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hours, setHours] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(hours);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">Délai d'envoi</span>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {hours} heures
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Math.max(1, Math.min(72, parseInt(e.target.value) || 1)))}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
              max="72"
              required
            />
            <button
              type="submit"
              className="px-2 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              OK
            </button>
          </form>
        )}
      </div>
    </div>
  );
}