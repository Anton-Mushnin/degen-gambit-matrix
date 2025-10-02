import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

interface DevModeProviderProps {
  children: ReactNode;
}

export const DevModeProvider: React.FC<DevModeProviderProps> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    // Check localStorage for persisted dev mode state
    const saved = localStorage.getItem('devMode');
    return saved === 'true';
  });

  const toggleDevMode = () => {
    setIsDevMode(prev => {
      const newValue = !prev;
      localStorage.setItem('devMode', newValue.toString());
      return newValue;
    });
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};

// Custom hook to use the dev mode context
export const useDevMode = (): DevModeContextType => {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};

// Export the context for direct usage if needed
export { DevModeContext };
