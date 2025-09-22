import React, { useRef, useEffect } from 'react';

interface LineChartProps {
  data: { x: number; y: number }[];
  title: string;
  xLabel: string;
  yLabel: string;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, xLabel, yLabel, color = '#22d3ee' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const { width, height } = rect;

    const padding = 40;
    const xMin = Math.min(...data.map(d => d.x));
    const xMax = Math.max(...data.map(d => d.x));
    const yMin = 0; //Math.min(...data.map(d => d.y));
    const yMax = Math.max(...data.map(d => d.y));

    const scaleX = (width - 2 * padding) / (xMax - xMin || 1);
    const scaleY = (height - 2 * padding) / (yMax - yMin || 1);

    const toCanvasX = (x: number) => padding + (x - xMin) * scaleX;
    const toCanvasY = (y: number) => height - padding - (y - yMin) * scaleY;
    
    ctx.clearRect(0, 0, width, height);

    // Draw axes and labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px sans-serif';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, padding / 2);
    ctx.fillText(xLabel, width / 2, height - 5);
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, -height / 2, 15);
    ctx.restore();
    
    ctx.textAlign = 'right';
    ctx.fillText(yMax.toExponential(1), padding - 5, padding + 5);
    ctx.fillText(yMin.toExponential(1), padding - 5, height - padding);

    ctx.textAlign = 'center';
    ctx.fillText(xMin.toString(), padding, height - padding + 15);
    ctx.fillText(xMax.toString(), width-padding, height - padding + 15);

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, i) => {
        const x = toCanvasX(point.x);
        const y = toCanvasY(point.y);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.forEach(point => {
        ctx.beginPath();
        ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 3, 0, 2 * Math.PI);
        ctx.fill();
    });

  }, [data, title, xLabel, yLabel, color]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};