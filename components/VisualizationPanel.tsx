import React from 'react';
import { useStore } from '../store/useStore';
import { Model } from '../types';
import { ScatterPlot } from './ScatterPlot';
import { ReconstructionGrid } from './ReconstructionGrid';
import { LineChart } from './LineChart';

export const VisualizationPanel: React.FC = () => {
  const { selectedModel, trainingState, isAppReady, data } = useStore();

  const renderContent = () => {
    if (!isAppReady) {
      return <LoadingSpinner text="Initializing Application..." />;
    }
    if (!data.tensor) {
        return <LoadingSpinner text="Loading Data..." />;
    }

    switch (selectedModel) {
      case Model.KMeans:
      case Model.Embedding:
        return <ScatterPlot />;
      
      case Model.Autoencoder:
        if (trainingState.isRunning || useStore.getState().aeLossHistory.length > 0) {
            return (
                <div className="h-full flex flex-col gap-4">
                    <div className="flex-1">
                        <LineChart
                            data={useStore.getState().aeLossHistory.map((loss, i) => ({ x: i + 1, y: loss }))}
                            title="Autoencoder Training Loss"
                            xLabel="Epoch"
                            yLabel="Loss (MSE)"
                            color="#f472b6"
                        />
                    </div>
                    <div className="flex-1">
                        <ReconstructionGrid />
                    </div>
                </div>
            );
        }
        return (
            <div className="h-full flex items-center justify-center text-center text-gray-400">
                <div>
                    <h3 className="text-xl font-semibold text-white">Autoencoder</h3>
                    <p>Configure parameters and press 'Run' to train the model.</p>
                </div>
            </div>
        );

      default:
        return <p>Select a model to begin.</p>;
    }
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 h-full w-full flex flex-col">
        <div className="flex-grow w-full h-full relative">
            {renderContent()}
        </div>
    </div>
  );
};

const LoadingSpinner: React.FC<{text: string}> = ({text}) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-2xl">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-white">{text}</p>
    </div>
);