import DegenGambit from './components/DegenGambit';
import { ThirdwebProvider } from 'thirdweb/react';
import './styles/fonts.css';

function App() {



  return (
    <div>
      <ThirdwebProvider>
        <DegenGambit />
      </ThirdwebProvider>
    </div>
  );
}

export default App;
