import React, { useEffect } from 'react';
import { FileText } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

interface TemplateSelectorProps {
  templates: NotificationTemplate[];
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
}

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect
}: TemplateSelectorProps) {
  const activeTemplates = templates.filter(t => t.isActive);

  // Auto-select the single template if it's the only one available
  useEffect(() => {
    if (activeTemplates.length === 1 && !selectedTemplateId) {
      onTemplateSelect(activeTemplates[0].id);
    }
  }, [activeTemplates, selectedTemplateId, onTemplateSelect]);

  if (activeTemplates.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <FileText className="h-4 w-4" />
        <span>Aucun modèle disponible</span>
      </div>
    );
  }

  if (activeTemplates.length === 1) {
    return (
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-700">{activeTemplates[0].name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <FileText className="h-4 w-4 text-gray-400" />
      <select
        value={selectedTemplateId || ''}
        onChange={(e) => onTemplateSelect(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
      >
        <option value="">Sélectionner un modèle...</option>
        {activeTemplates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
}