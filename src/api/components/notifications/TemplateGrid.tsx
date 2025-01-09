import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  sendHoursBefore: number;
  variables: string[];
}

interface TemplateGridProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onSendHoursChange: (templateId: string, hours: number) => void;
}

const TemplateGrid: React.FC<TemplateGridProps> = ({
  templates,
  onEdit,
  onDelete,
  onSendHoursChange,
}) => {
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [tempHours, setTempHours] = useState<number>(0);

  const handleHoursSubmit = (templateId: string, hours: number, e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    
    onSendHoursChange(templateId, hours);
    setEditingHoursId(null);
  };

  const startEditing = (template: Template) => {
    setEditingHoursId(template.id);
    setTempHours(template.sendHoursBefore);
  };

  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun modèle disponible. Créez votre premier modèle en cliquant sur "Nouveau modèle".</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  template.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {template.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.content}</p>
            
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              {editingHoursId === template.id ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Envoi</span>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={tempHours}
                    onChange={(e) => setTempHours(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => handleHoursSubmit(template.id, tempHours, e)}
                    onBlur={() => handleHoursSubmit(template.id, tempHours)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600">heures avant le RDV</span>
                </div>
              ) : (
                <div 
                  className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => startEditing(template)}
                >
                  Envoi <span className="font-bold">{template.sendHoursBefore}</span> heures avant le RDV
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(template)}
                  className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors duration-200"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(template)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-200"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateGrid;
