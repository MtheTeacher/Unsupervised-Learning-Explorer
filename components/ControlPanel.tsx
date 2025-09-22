import React from 'react';
import { useStore } from '../store/useStore';
import { Dataset, Model, EmbeddingMethod } from '../types';
import { Tooltip } from './common/Tooltip';
import { runKMeans, calculateElbow } from '../services/kmeansService';
import { runEmbedding } from '../services/embeddingService';
import { runAutoencoderTraining } from '../services/autoencoderService';
import { PlayIcon, StopIcon, ShuffleIcon, EyeIcon } from './common/Icons';

const PanelCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 mb-8">
    <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/20">{title}</h3>
    {children}
  </div>
);

const ControlButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode, className?: string }> = ({ onClick, disabled, children, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-center p-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${className} ${disabled ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'hover:opacity-90'}`}
  >
    {children}
  </button>
);

export const ControlPanel: React.FC = () => {
  const store = useStore();

  const handleRun = () => {
    switch (store.selectedModel) {
      case Model.KMeans:
        runKMeans();
        break;
      case Model.Embedding:
        runEmbedding();
        break;
      case Model.Autoencoder:
        runAutoencoderTraining();
        break;
    }
  };

  const handleStop = () => {
    store.setTrainingState({ isRunning: false, statusText: 'Stopped by user' });
  };
  
  const handleRevealLabels = () => {
    store.setGroundTruthRevealed(!store.groundTruthRevealed);
  };
  
  const handleRunElbow = async () => {
    if(store.data.tensor) {
       calculateElbow();
    }
  }

  return (
    <div className="h-full max-h-[calc(100vh-14rem)] flex flex-col">
      <div className="flex-grow overflow-y-auto pr-2">
        <PanelCard title="1. Dataset">
          <select
            value={store.selectedDataset}
            onChange={(e) => store.setSelectedDataset(e.target.value as Dataset)}
            className="w-full bg-black/20 border border-white/20 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            {Object.values(Dataset).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </PanelCard>

        <PanelCard title="2. Preprocessing">
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Scale Features (0-1)</span>
              <input type="checkbox" checked={store.featureScale} onChange={(e) => store.setFeatureScale(e.target.checked)} className="toggle-checkbox" />
            </label>
            <label className="flex items-center justify-between">
              <span>Add Gaussian Noise</span>
              <input type="checkbox" checked={store.addNoise} onChange={(e) => store.setAddNoise(e.target.checked)} className="toggle-checkbox" />
            </label>
            {store.addNoise && (
              <div className="flex items-center space-x-2">
                <input type="range" min="0.01" max="0.5" step="0.01" value={store.noiseLevel} onChange={(e) => store.setNoiseLevel(parseFloat(e.target.value))} className="w-full" />
                <span className="text-sm w-12 text-right">{store.noiseLevel.toFixed(2)}</span>
              </div>
            )}
             <ControlButton onClick={() => store.processData()} disabled={store.trainingState.isRunning} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                <ShuffleIcon/> Apply & Resample
            </ControlButton>
          </div>
        </PanelCard>

        <PanelCard title="3. Model">
          <select
            value={store.selectedModel}
            onChange={(e) => store.setSelectedModel(e.target.value as Model)}
            className="w-full bg-black/20 border border-white/20 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            {Object.values(Model).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="mt-4">
            {store.selectedModel === Model.KMeans && <KMeansControls />}
            {store.selectedModel === Model.Embedding && <EmbeddingControls />}
            {store.selectedModel === Model.Autoencoder && <AutoencoderControls />}
          </div>
        </PanelCard>
      </div>

      <div className="flex-shrink-0 pt-4 border-t border-white/20">
        <div className="space-y-3">
          <div className="flex space-x-3">
            <ControlButton onClick={handleRun} disabled={store.trainingState.isRunning || !store.isAppReady} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <PlayIcon /> {store.trainingState.isRunning ? 'Running...' : 'Run'}
            </ControlButton>
            <ControlButton onClick={handleStop} disabled={!store.trainingState.isRunning} className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <StopIcon /> Stop
            </ControlButton>
          </div>
          { (store.selectedModel === Model.KMeans || store.selectedModel === Model.Embedding) && store.data.labels && (
            <ControlButton onClick={handleRevealLabels} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                <EyeIcon /> {store.groundTruthRevealed ? 'Hide Labels' : 'Reveal Ground Truth'}
            </ControlButton>
          )}
        </div>
        <p className="text-center text-sm text-gray-400 mt-3 h-5">{store.trainingState.statusText}</p>
      </div>
    </div>
  );
};

const KMeansControls: React.FC = () => {
    const { k, setK, trainingState } = useStore();
    return (
        <div className="space-y-3">
            <label className="flex items-center justify-between">
                <span className="flex items-center">
                    Number of Clusters (k)
                    <Tooltip text="The number of distinct groups to find in the data." />
                </span>
                <span className="font-mono">{k}</span>
            </label>
            <input type="range" min="2" max="15" step="1" value={k} onChange={e => setK(parseInt(e.target.value))} className="w-full"/>
             <ControlButton onClick={calculateElbow} disabled={trainingState.isRunning} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm py-1">
                Calculate Elbow Plot
            </ControlButton>
        </div>
    );
};

const EmbeddingControls: React.FC = () => {
    const { embeddingMethod, setEmbeddingMethod, pcaComponents, setPcaComponents } = useStore();
    return (
        <div className="space-y-3">
            <label>Method</label>
            <select value={embeddingMethod} onChange={e => setEmbeddingMethod(e.target.value as EmbeddingMethod)} className="w-full bg-black/20 border border-white/20 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none">
                {Object.values(EmbeddingMethod).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {embeddingMethod === EmbeddingMethod.UMAP &&
                <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm">
                        <span>PCA pre-reduction
                            <Tooltip text="Reduce dimensions with PCA before UMAP for better performance and results." />
                        </span>
                        <span>{pcaComponents} comps</span>
                    </label>
                    <input type="range" min="2" max="50" step="1" value={pcaComponents} onChange={e => setPcaComponents(parseInt(e.target.value))} className="w-full"/>
                </div>
            }
        </div>
    );
};


const AutoencoderControls: React.FC = () => {
    const { aeBottleneck, setAeBottleneck, aeEpochs, setAeEpochs, aeLearningRate, setAeLearningRate } = useStore();
    return (
        <div className="space-y-4 text-sm">
            <div>
                <label className="flex items-center justify-between">
                    <span>Bottleneck Size
                        <Tooltip text="Size of the compressed representation. Smaller sizes force more compression." />
                    </span>
                    <span className="font-mono">{aeBottleneck}</span>
                </label>
                <input type="range" min="2" max="64" step="1" value={aeBottleneck} onChange={e => setAeBottleneck(parseInt(e.target.value))} className="w-full"/>
            </div>
            <div>
                <label className="flex items-center justify-between">
                    <span>Epochs
                        <Tooltip text="Number of times the full dataset is passed through the network for training." />
                    </span>
                    <span className="font-mono">{aeEpochs}</span>
                </label>
                <input type="range" min="1" max="20" step="1" value={aeEpochs} onChange={e => setAeEpochs(parseInt(e.target.value))} className="w-full"/>
            </div>
            <div>
                 <label className="flex items-center justify-between">
                    <span>Learning Rate
                        <Tooltip text="Controls how much to change the model in response to the estimated error each time the weights are updated." />
                    </span>
                    <span className="font-mono">{aeLearningRate.toExponential(1)}</span>
                </label>
                <input type="range" min="0.0001" max="0.01" step="0.0001" value={aeLearningRate} onChange={e => setAeLearningRate(parseFloat(e.target.value))} className="w-full"/>
            </div>
        </div>
    );
};