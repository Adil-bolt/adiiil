import React, { createContext, useContext, useState, useCallback } from 'react';

type UpdateSource = 'agenda' | 'dashboard' | 'patients' | 'payments';

interface UpdateContextType {
  lastUpdate: {
    timestamp: number;
    source: UpdateSource;
    type: 'delete' | 'update' | 'create';
    entityId?: string;
  } | null;
  triggerUpdate: (source: UpdateSource, type: 'delete' | 'update' | 'create', entityId?: string) => void;
}

const UpdateContext = createContext<UpdateContextType | null>(null);

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState<UpdateContextType['lastUpdate']>(null);

  const triggerUpdate = useCallback((
    source: UpdateSource,
    type: 'delete' | 'update' | 'create',
    entityId?: string
  ) => {
    setLastUpdate({
      timestamp: Date.now(),
      source,
      type,
      entityId
    });
  }, []);

  return (
    <UpdateContext.Provider value={{ lastUpdate, triggerUpdate }}>
      {children}
    </UpdateContext.Provider>
  );
};
