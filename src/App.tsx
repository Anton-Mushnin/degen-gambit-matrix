import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';
import { TerminalOutput } from './components/TerminalOutput';
// import Home from './components/Home';
import ZigZagZog from './components/zigZagZog/ZIgZagZog';

function App() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 1000;

  return (
    <div style={{paddingBottom: '0px', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {(isMobile || isSmallScreen) && false ? (
        <div style={{paddingLeft: '20px'}}>
          <TerminalOutput text={'This version requires desktop'} setIsSystemTyping={() => {}} />
        </div>
      ) : (
        <ThirdwebProvider>
          <ZigZagZog />
          {/* <Home /> */}
        </ThirdwebProvider>
      )}
    </div>
  );
}

export default App;
