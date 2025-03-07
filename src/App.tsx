import DegenGambit from './components/DegenGambit';
import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';

function App() {



  return (
    <div style={{paddingBottom: '30px'}}>
      <ThirdwebProvider>
        <DegenGambit />
      </ThirdwebProvider>
    </div>
  );
}

export default App;
