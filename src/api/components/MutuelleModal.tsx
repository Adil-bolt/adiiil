import React, { useState } from 'react';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import DraggableModal from './DraggableModal';

interface MutuelleModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMutuelles: string[];
  onSaveMutuelle: (mutuelle: string) => void;
  initialMutuelle?: string;
}

export default function MutuelleModal({
  isOpen,
  onClose,
  savedMutuelles,
  onSaveMutuelle,
  initialMutuelle
}: MutuelleModalProps) {
  const [mutuelles, setMutuelles] = useState<string[]>(savedMutuelles);
  const [selectedMutuelle, setSelectedMutuelle] = useState(initialMutuelle || '');
  const [newMutuelle, setNewMutuelle] = useState('');

  const handleAdd = () => {
    if (newMutuelle.trim() && !mutuelles.includes(newMutuelle.trim())) {
      setMutuelles(prev => [...prev, newMutuelle.trim()]);
      setNewMutuelle('');
    }
  };

  const handleSelect = (mutuelle: string) => {
    setSelectedMutuelle(mutuelle);
  };

  const handleSubmit = () => {
    if (selectedMutuelle) {
      onSaveMutuelle(selectedMutuelle);
    }
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sélectionner une mutuelle"
      className="w-full max-w-md"
    >
      <div className="space-y-4">
        {/* Ajouter une nouvelle mutuelle */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMutuelle}
            onChange={(e) => setNewMutuelle(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Nouvelle mutuelle..."
          />
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </button>
        </div>

        {/* Liste des mutuelles */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {mutuelles.map((mutuelle) => (
            <div
              key={mutuelle}
              onClick={() => handleSelect(mutuelle)}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                selectedMutuelle === mutuelle
                  ? 'bg-indigo-50 border-indigo-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span className="flex-1 text-sm font-medium text-gray-900">
                {mutuelle}
              </span>
              {selectedMutuelle === mutuelle && (
                <Check className="h-4 w-4 text-indigo-600" />
              )}
            </div>
          ))}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedMutuelle}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
              selectedMutuelle
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </DraggableModal>
  );
}