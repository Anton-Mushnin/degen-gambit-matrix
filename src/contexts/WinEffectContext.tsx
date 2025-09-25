import React, { createContext, useContext, ReactNode, useState } from 'react';
import Matrix from '../components/matrixUI/Matrix';

interface WinEffectContextType {
  triggerWinEffect: (outcome?: any) => void;
}

const WinEffectContext = createContext<WinEffectContextType | undefined>(undefined);

interface WinEffectProviderProps {
  children: ReactNode;
}

export const WinEffectProvider: React.FC<WinEffectProviderProps> = ({ children }) => {
  const [isWin, setIsWin] = useState(false);
  const [outcome, setOutcome] = useState<any>(null);

  const triggerWinEffect = (outcome?: any) => {
    setOutcome(outcome || [1, 1, 1]);
    setIsWin(true);
  };

  const closeWinEffect = () => {
    setIsWin(false);
    setOutcome(null);
  };

  return (
    <WinEffectContext.Provider value={{ triggerWinEffect }}>
      {children}
      {isWin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}>
          <Matrix outcome={outcome} onClose={closeWinEffect} />
        </div>
      )}
    </WinEffectContext.Provider>
  );
};

export const useWinEffect = (): WinEffectContextType => {
  const context = useContext(WinEffectContext);
  if (context === undefined) {
    throw new Error('useWinEffect must be used within a WinEffectProvider');
  }
  return context;
};
