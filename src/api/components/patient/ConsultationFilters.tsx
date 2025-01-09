import React from 'react';

interface ConsultationFiltersProps {
  hideConsultations: boolean;
  showSpecificConsultations: boolean;
  hideCount: string;
  showCount: string;
  onHideChange: (checked: boolean) => void;
  onShowChange: (checked: boolean) => void;
  onHideCountChange: (count: string) => void;
  onShowCountChange: (count: string) => void;
}

export default function ConsultationFilters({
  hideConsultations,
  showSpecificConsultations,
  hideCount,
  showCount,
  onHideChange,
  onShowChange,
  onHideCountChange,
  onShowCountChange
}: ConsultationFiltersProps) {
  return (
    <div className="flex items-center space-x-6 px-6 py-3 bg-gray-50 border-b border-gray-200">
      <span className="font-medium text-sm text-gray-700">Filtre Consultations:</span>
      <div className="flex items-center space-x-2">
        <label className="flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={hideConsultations}
            onChange={(e) => onHideChange(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Masquer</span>
        </label>
        {hideConsultations && (
          <input
            type="text"
            value={hideCount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              onHideCountChange(value);
            }}
            className="w-12 px-2 py-1 text-sm border border-gray-300 rounded-md"
            placeholder="0"
          />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <label className="flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showSpecificConsultations}
            onChange={(e) => onShowChange(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Afficher</span>
        </label>
        {showSpecificConsultations && (
          <input
            type="text"
            value={showCount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              onShowCountChange(value);
            }}
            className="w-12 px-2 py-1 text-sm border border-gray-300 rounded-md"
            placeholder="3"
          />
        )}
      </div>
    </div>
  );
}