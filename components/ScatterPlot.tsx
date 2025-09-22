import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Model } from '../types';

const COLORS = [
    '#22d3ee', // cyan
    '#f472b6', // pink
    '#f97316', // orange
    '#4ade80', // green
    '#a855f7', // purple
    '#eab308', // yellow
    '#3b82f6', // blue
    '#ef4444', // red
    '#14b8a6', // teal
    '#d946ef', // fuchsia
    // Add variations for more clusters
    '#67e8f9',
    '#f9a8d4',
    '#fdba74',
    '#86efac',
    '#c084fc',
];

export const ScatterPlot: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { embedding, kmeansResults, data, groundTruthRevealed, selectedModel, trainingState } = useStore();
    const [prevCentroids, setPrevCentroids] = useState<number[][] | null>(null);
    const [animationProgress, setAnimationProgress] = useState(1);

    const points = selectedModel === Model.Embedding ? embedding : data.tensor?.arraySync() as number[][];
    const assignments = groundTruthRevealed ? data.labels : kmeansResults.assignments;

    useEffect(() => {
        if (kmeansResults.centroids && prevCentroids && prevCentroids.length === kmeansResults.centroids.length) {
            setAnimationProgress(0);
        }
        if (kmeansResults.centroids) {
            setPrevCentroids(kmeansResults.centroids);
        }
    }, [kmeansResults.centroids]);

    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            if (animationProgress < 1) {
                setAnimationProgress(prev => Math.min(prev + 0.05, 1));
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        if (trainingState.isRunning && selectedModel === Model.KMeans) {
            animate();
        } else {
            setAnimationProgress(1);
        }
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [animationProgress, trainingState.isRunning, selectedModel]);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !points) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const width = rect.width;
        const height = rect.height;

        const padding = 40;
        const xMin = Math.min(...points.map(p => p[0]));
        const xMax = Math.max(...points.map(p => p[0]));
        const yMin = Math.min(...points.map(p => p[1]));
        const yMax = Math.max(...points.map(p => p[1]));

        const scaleX = (width - 2 * padding) / (xMax - xMin);
        const scaleY = (height - 2 * padding) / (yMax - yMin);

        const toCanvasX = (x: number) => padding + (x - xMin) * scaleX;
        const toCanvasY = (y: number) => padding + (y - yMin) * scaleY;

        ctx.clearRect(0, 0, width, height);
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(yMin.toFixed(2), padding / 2, height - padding);
        ctx.fillText(yMax.toFixed(2), padding / 2, padding);
        ctx.textAlign = 'left';
        ctx.fillText(xMin.toFixed(2), padding, height - padding / 2);
        ctx.textAlign = 'right';
        ctx.fillText(xMax.toFixed(2), width - padding, height - padding / 2);


        // Draw points
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const assignment = assignments ? assignments[i] : -1;
            ctx.fillStyle = assignment !== -1 ? COLORS[assignment % COLORS.length] : 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(toCanvasX(point[0]), toCanvasY(point[1]), 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw centroids
        if (kmeansResults.centroids && prevCentroids) {
            for (let i = 0; i < kmeansResults.centroids.length; i++) {
                const start = prevCentroids[i];
                const end = kmeansResults.centroids[i];

                const interpX = start[0] + (end[0] - start[0]) * animationProgress;
                const interpY = start[1] + (end[1] - start[1]) * animationProgress;

                const cx = toCanvasX(interpX);
                const cy = toCanvasY(interpY);
                
                ctx.fillStyle = COLORS[i % COLORS.length];
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                
                ctx.beginPath();
                ctx.moveTo(cx - 8, cy - 8);
                ctx.lineTo(cx + 8, cy + 8);
                ctx.moveTo(cx + 8, cy - 8);
                ctx.lineTo(cx - 8, cy + 8);
                ctx.stroke();
            }
        }

    }, [points, assignments, kmeansResults.centroids, prevCentroids, animationProgress, groundTruthRevealed]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};