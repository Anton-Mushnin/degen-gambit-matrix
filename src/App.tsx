import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';
import { TerminalOutput } from './components/matrixUI/TerminalOutput';
import Home from './components/Home';
import { GameProvider } from './contexts/GameContext';
import { WinEffectProvider } from './contexts/WinEffectContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


function App() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 1000;

  return (
    <div style={{paddingBottom: '0px'}}>
      {(isMobile || isSmallScreen) ? (
        <div style={{paddingLeft: '20px'}}>
          <TerminalOutput text={'This version requires desktop'} setIsSystemTyping={() => {}} />
        </div>
      ) : (
        <ThirdwebProvider>
          <GameProvider>
            <WinEffectProvider>
              <Home />
            </WinEffectProvider>
          </GameProvider>
          <ReactQueryDevtools initialIsOpen={false} />

        </ThirdwebProvider>
      )}
    </div>
  );
}

export default App;
