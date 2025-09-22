
import * as tf from '@tensorflow/tfjs';

export enum Dataset {
  Iris = 'Iris',
  MNIST_Digits = 'MNIST_Digits',
  Fashion_MNIST = 'Fashion_MNIST',
}

export enum Model {
  KMeans = 'k-Means Clustering',
  Embedding = 'Embedding (PCA/UMAP)',
  Autoencoder = 'Autoencoder',
}

export enum EmbeddingMethod {
  PCA = 'PCA',
  UMAP = 'UMAP',
}

export interface TrainingState {
  isRunning: boolean;
  isPaused: boolean;
  currentIteration: number;
  maxIterations: number;
  currentEpoch: number;
  maxEpochs: number;
  statusText: string;
}

export interface DataState {
  tensor: tf.Tensor2D | null;
  labels: number[] | null;
  shape: number[] | null;
  precomputed_embedding: number[][] | null;
}

export interface KMeansResult {
  assignments: number[] | null;
  centroids: number[][] | null;
  sse: number | null;
}

export interface AETrainingProgress {
    epoch: number;
    loss: number;
    reconstructions: tf.Tensor | null;
}
