import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';
import { TerminalOutput } from './components/matrixUI/TerminalOutput';
import Home from './components/Home';
import { GameProvider } from './contexts/GameContext';

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
            <Home />
          </GameProvider>
        </ThirdwebProvider>
      )}
    </div>
  );
}

export default App;
