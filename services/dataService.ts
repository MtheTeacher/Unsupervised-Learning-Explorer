
import * as tf from '@tensorflow/tfjs';
import { Dataset } from '../types';
import { IRIS_DATA } from './datasets/iris';
import { MNIST_SAMPLE_DATA, MNIST_SAMPLE_LABELS, MNIST_PRECOMPUTED_UMAP } from './datasets/mnistSample';


export function loadIrisData() {
  const data = IRIS_DATA.map(row => [row.sepalLength, row.sepalWidth, row.petalLength, row.petalWidth]);
  const labels = IRIS_DATA.map(row => row.species);
  const shape = [data.length, data[0].length];
  return { data, labels, shape, precomputed_embedding: null };
}

export async function loadMnistData(dataset: Dataset) {
    // For this demo, we use a small, pre-loaded sample of MNIST digits for all image datasets.
    // In a real app, this would fetch the appropriate dataset.
    const data = MNIST_SAMPLE_DATA;
    const labels = MNIST_SAMPLE_LABELS;
    const shape = [data.length, data[0].length];
    const precomputed_embedding = MNIST_PRECOMPUTED_UMAP;
    return { data, labels, shape, precomputed_embedding };
}

export function applyPreprocessing(tensor: tf.Tensor2D, scale: boolean, addNoise: boolean, noiseLevel: number): tf.Tensor2D {
    return tf.tidy(() => {
        let processedTensor = tensor.clone();

        if (scale) {
            const min = processedTensor.min(0);
            const max = processedTensor.max(0);
            processedTensor = processedTensor.sub(min).div(max.sub(min));
        }

        if (addNoise) {
            const noise = tf.randomNormal(processedTensor.shape, 0, noiseLevel);
            processedTensor = processedTensor.add(noise).clipByValue(0, 1);
        }
        
        return processedTensor;
    });
}
