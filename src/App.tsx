import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';
import { TerminalOutput } from './components/degen-gambit/TerminalOutput';
import Home from './components/Home';

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
          <Home />
        </ThirdwebProvider>
      )}
    </div>
  );
}

export default App;
