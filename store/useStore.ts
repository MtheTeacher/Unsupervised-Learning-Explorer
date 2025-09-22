
import { create } from 'zustand';
import * as tf from '@tensorflow/tfjs';
import { Dataset, Model, EmbeddingMethod, TrainingState, DataState, KMeansResult, AETrainingProgress } from '../types';
import { loadIrisData, loadMnistData, applyPreprocessing } from '../services/dataService';

interface AppState {
  isAppReady: boolean;
  tfBackend: string;

  // Control Panel State
  selectedDataset: Dataset;
  selectedModel: Model;
  
  // Preprocessing
  featureScale: boolean;
  addNoise: boolean;
  noiseLevel: number;

  // K-Means State
  k: number;
  kmeansResults: KMeansResult;
  elbowData: {k: number, sse: number}[];

  // Embedding State
  embeddingMethod: EmbeddingMethod;
  embedding: number[][] | null;
  pcaComponents: number;
  
  // Autoencoder State
  aeBottleneck: number;
  aeEpochs: number;
  aeLearningRate: number;
  aeLossHistory: number[];
  aeReconstructions: { original: tf.Tensor, reconstructed: tf.Tensor } | null;
  
  // Shared State
  trainingState: TrainingState;
  data: DataState;
  groundTruthRevealed: boolean;
  
  // Actions
  setAppReady: (isReady: boolean) => void;
  setTfBackend: (backend: string) => void;
  
  setSelectedDataset: (dataset: Dataset) => void;
  setSelectedModel: (model: Model) => void;
  
  setFeatureScale: (scale: boolean) => void;
  setAddNoise: (noise: boolean) => void;
  setNoiseLevel: (level: number) => void;

  setK: (k: number) => void;
  setKMeansResults: (results: KMeansResult) => void;
  setElbowData: (data: {k: number, sse: number}[]) => void;

  setEmbeddingMethod: (method: EmbeddingMethod) => void;
  setEmbedding: (embedding: number[][] | null) => void;
  setPcaComponents: (components: number) => void;
  
  setAeBottleneck: (size: number) => void;
  setAeEpochs: (epochs: number) => void;
  setAeLearningRate: (lr: number) => void;
  setAeLossHistory: (history: number[]) => void;
  addAeLossPoint: (loss: number) => void;
  setAeReconstructions: (recons: { original: tf.Tensor, reconstructed: tf.Tensor } | null) => void;

  setTrainingState: (update: Partial<TrainingState>) => void;
  setData: (data: DataState) => void;
  setGroundTruthRevealed: (revealed: boolean) => void;
  
  loadInitialData: () => Promise<void>;
  processData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isAppReady: false,
  tfBackend: '',
  
  selectedDataset: Dataset.Iris,
  selectedModel: Model.KMeans,
  
  featureScale: true,
  addNoise: false,
  noiseLevel: 0.1,
  
  k: 3,
  kmeansResults: { assignments: null, centroids: null, sse: null },
  elbowData: [],

  embeddingMethod: EmbeddingMethod.UMAP,
  embedding: null,
  pcaComponents: 10,
  
  aeBottleneck: 16,
  aeEpochs: 5,
  aeLearningRate: 0.001,
  aeLossHistory: [],
  aeReconstructions: null,

  trainingState: {
    isRunning: false,
    isPaused: false,
    currentIteration: 0,
    maxIterations: 20,
    currentEpoch: 0,
    maxEpochs: 5,
    statusText: 'Ready',
  },
  data: {
    tensor: null,
    labels: null,
    shape: null,
    precomputed_embedding: null
  },
  groundTruthRevealed: false,

  setAppReady: (isReady) => set({ isAppReady: isReady }),
  setTfBackend: (backend) => set({ tfBackend: backend }),
  
  setSelectedDataset: async (dataset) => {
    set({ selectedDataset: dataset, groundTruthRevealed: false, embedding: null, kmeansResults: { assignments: null, centroids: null, sse: null }, aeReconstructions: null, aeLossHistory: [] });
    await get().processData();
    // Reset model specific things
    if (dataset === Dataset.Iris) {
      set({ k: 3, selectedModel: Model.KMeans });
    } else if (dataset === Dataset.MNIST_Digits) {
      set({ k: 10, selectedModel: Model.Embedding });
    } else {
      set({ selectedModel: Model.Autoencoder });
    }
  },
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setFeatureScale: (scale) => set({ featureScale: scale }),
  setAddNoise: (noise) => set({ addNoise: noise }),
  setNoiseLevel: (level) => set({ noiseLevel: level }),

  setK: (k) => set({ k }),
  setKMeansResults: (results) => set({ kmeansResults: results }),
  setElbowData: (data) => set({ elbowData: data }),
  
  setEmbeddingMethod: (method) => set({ embeddingMethod: method }),
  setEmbedding: (embedding) => set({ embedding }),
  setPcaComponents: (components) => set({ pcaComponents: components }),

  setAeBottleneck: (size) => set({ aeBottleneck: size }),
  setAeEpochs: (epochs) => set({ aeEpochs: epochs }),
  setAeLearningRate: (lr) => set({ aeLearningRate: lr }),
  setAeLossHistory: (history) => set({ aeLossHistory: history }),
  addAeLossPoint: (loss) => set(state => ({ aeLossHistory: [...state.aeLossHistory, loss] })),
  setAeReconstructions: (recons) => {
    // Dispose previous tensors
    const oldRecons = get().aeReconstructions;
    if (oldRecons) {
        tf.dispose([oldRecons.original, oldRecons.reconstructed]);
    }
    set({ aeReconstructions: recons });
  },

  setTrainingState: (update) => set(state => ({ trainingState: { ...state.trainingState, ...update } })),
  setData: (data) => {
    // Dispose old tensor
    const oldTensor = get().data.tensor;
    if (oldTensor) {
      oldTensor.dispose();
    }
    set({ data });
  },
  setGroundTruthRevealed: (revealed) => set({ groundTruthRevealed: revealed }),

  loadInitialData: async () => {
    await get().processData();
  },

  processData: async () => {
    const { selectedDataset, featureScale, addNoise, noiseLevel } = get();
    set({ trainingState: { ...get().trainingState, statusText: `Loading ${selectedDataset}...` }});
    
    let rawData, labels, shape, precomputed_embedding;
    if (selectedDataset === Dataset.Iris) {
      ({ data: rawData, labels, shape } = loadIrisData());
    } else if (selectedDataset === Dataset.MNIST_Digits || selectedDataset === Dataset.Fashion_MNIST) {
      ({ data: rawData, labels, shape, precomputed_embedding } = await loadMnistData(selectedDataset));
    } else {
      return;
    }

    const processedTensor = tf.tidy(() => {
        let tensor = tf.tensor2d(rawData, shape);
        return applyPreprocessing(tensor, featureScale, addNoise, noiseLevel);
    });

    get().setData({ tensor: processedTensor, labels, shape, precomputed_embedding });
    set({ trainingState: { ...get().trainingState, statusText: 'Ready' }});
    console.log(`Processed data for ${selectedDataset}. Tensor shape: ${processedTensor.shape}`);
  }
}));
