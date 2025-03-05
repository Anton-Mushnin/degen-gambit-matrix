import { MatrixTerminal } from './components/MatrixTerminal';
import { ThirdwebProvider } from 'thirdweb/react';

function App() {



  return (
    <div>
      <ThirdwebProvider>
        <MatrixTerminal typingSpeed={100} />
      </ThirdwebProvider>
    </div>
  );
}

export default App;
