import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';
import ZigZagZog from './components/zigZagZog/ZIgZagZog';

function App() {

  return (
    <div style={{paddingBottom: '0px', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>

        <ThirdwebProvider>
          <ZigZagZog />
        </ThirdwebProvider>
    </div>
  );
}

export default App;
