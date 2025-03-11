import { useEffect, useRef, useState } from 'react';

const styles = `
@keyframes scaleUp {
  0%, 50% {
    transform: scale(1);
    opacity: 1;
  }
  90% {
    opacity: 1;
    transform: scale(8);
  }
  92% {
    opacity: 0.8;
    transform: scale(8);
  }
  100% {
    transform: scale(100) translateY(-200px);
    opacity: 0;
  }
}
`;

const color = '#a1eeb5';
const glow = '#0dda9f';

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const Matrix: React.FC<{outcome: number[]}> = ({outcome}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenSize, setScreenSize] = useState({width: 0, height: 0});
  const [digitPositions, setDigitPositions] = useState<{x: number, y: number, digit: string}[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = document.body.offsetWidth;
    const h = canvas.height = document.body.offsetHeight;
    if (!screenSize.width || !screenSize.height) {
        setScreenSize({width: w, height: h});
    }
    const cols = Math.floor(w / 20) + 1;
    const rows = Math.floor(h / 20); // Calculate number of rows based on height

    const ypos = Array(cols).fill(0);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    function matrix() {
      if (!ctx) return;
      
      ctx.fillStyle = '#0001';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = color;
      ctx.font = '15pt monospace';
      
      ypos.forEach((y, ind) => {
        const text = String.fromCharCode(Math.random() * 128);
        const x = ind * 20;
        digitPositions.forEach(dp => {
            if (y === ypos.length / 4 || y === ypos.length / 4 + 1) {
                ctx.fillStyle = '#FFF';
                ctx.fillText(dp.digit, dp.x * 20, dp.y * 20);
            }
        });
        if (digitPositions.find(dp => dp.x === ind && dp.y === y / 20)) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(digitPositions.find(dp => dp.x === ind && dp.y === y / 20)?.digit || text, x, y);
        } else {
            ctx.fillStyle = color;
            ctx.fillText(text, x, y);
        }
        if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + 20;
      });
    }


    const handleResize = () => {
        const width = document.body.offsetWidth;
        const height = document.body.offsetHeight;
        setScreenSize({width, height});
    }

  
    window.addEventListener('resize', handleResize);

    const intervalId = setInterval(matrix, 50);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('resize', handleResize);
    }
  }, [screenSize, digitPositions]); 


  useEffect(() => {
    // console.log(outcome, screenSize);
    if (!screenSize.width || !screenSize.height || !outcome?.length) return;
    const cols = Math.floor(screenSize.width / 20) + 1;
    const rows = Math.floor(screenSize.height / 20);
    let outcomeNumbers: {x: number, y: number, digit: string}[] = [];
    for (let i = 0; i < outcome.length; i++) {
        const x = Math.floor(Math.random() * (cols/3) + (i * cols/3));
        const y = Math.floor(Math.random() * rows / 2);
        const digitPositions = outcome[i].toString().split('').map((d, idx) => ({x: x + idx, y, digit: d}));
        outcomeNumbers.push(...digitPositions);
    }
    outcomeNumbers.push({x: 2, y: 2, digit: '7'});
    setDigitPositions(outcomeNumbers);
    console.log(outcomeNumbers);
  }, [outcome, screenSize])
    
    




  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0,
        animation: 'scaleUp 10s ease-in-out forwards',
        cursor: 'none',
      }}
    />
  );
};

export default Matrix;