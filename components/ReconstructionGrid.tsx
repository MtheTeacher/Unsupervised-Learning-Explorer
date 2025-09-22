import React, { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useStore } from '../store/useStore';

export const ReconstructionGrid: React.FC = () => {
    const { aeReconstructions } = useStore();
    const gridRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!aeReconstructions || !gridRef.current) return;
        
        const { original, reconstructed } = aeReconstructions;
        const numImages = original.shape[0];
        const imageSize = Math.sqrt(original.shape[1]);
        
        const container = gridRef.current;
        container.innerHTML = '';
        
        const originalArray = original.arraySync() as number[][];
        const reconstructedArray = reconstructed.arraySync() as number[][];
        
        for (let i = 0; i < numImages; i++) {
            const pairContainer = document.createElement('div');
            pairContainer.className = 'flex flex-col items-center p-1';

            const origCanvas = document.createElement('canvas');
            const reconCanvas = document.createElement('canvas');
            origCanvas.width = imageSize * 2;
            origCanvas.height = imageSize * 2;
            reconCanvas.width = imageSize * 2;
            reconCanvas.height = imageSize * 2;
            
            drawToCanvas(originalArray[i], origCanvas, imageSize);
            drawToCanvas(reconstructedArray[i], reconCanvas, imageSize);

            const origLabel = document.createElement('p');
            origLabel.textContent = 'Original';
            origLabel.className = 'text-xs text-center text-gray-400 mt-1';
            const reconLabel = document.createElement('p');
            reconLabel.textContent = 'Recon';
            reconLabel.className = 'text-xs text-center text-gray-400 mt-1';

            const origDiv = document.createElement('div');
            origDiv.appendChild(origCanvas);
            origDiv.appendChild(origLabel);

            const reconDiv = document.createElement('div');
            reconDiv.appendChild(reconCanvas);
            reconDiv.appendChild(reconLabel);

            pairContainer.appendChild(origDiv);
            pairContainer.appendChild(reconDiv);
            container.appendChild(pairContainer);
        }

    }, [aeReconstructions]);
    
    const drawToCanvas = (imageData: number[], canvas: HTMLCanvasElement, size: number) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const canvasImageData = ctx.createImageData(size, size);
        for (let j = 0; j < imageData.length; j++) {
            const value = imageData[j] * 255;
            canvasImageData.data[j * 4] = value;
            canvasImageData.data[j * 4 + 1] = value;
            canvasImageData.data[j * 4 + 2] = value;
            canvasImageData.data[j * 4 + 3] = 255;
        }
        
        // Use createImageBitmap for sharp pixels
        createImageBitmap(canvasImageData).then(bitmap => {
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        });
    };

    if (!aeReconstructions) {
        return <div className="w-full h-full flex items-center justify-center text-gray-400">Awaiting reconstructions...</div>
    }

    return (
        <div className="w-full h-full overflow-auto p-2 border border-white/20 rounded-lg bg-black/20">
            <h3 className="text-sm font-semibold text-center mb-2 text-gray-200">Input vs. Reconstruction</h3>
            <div ref={gridRef} className="grid grid-cols-5 md:grid-cols-8 gap-1"></div>
        </div>
    );
};