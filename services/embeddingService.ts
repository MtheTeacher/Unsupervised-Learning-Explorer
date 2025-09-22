
import * as tf from '@tensorflow/tfjs';
import { UMAP } from 'umap-js';
import { useStore } from '../store/useStore';
import { EmbeddingMethod, Model } from '../types';

async function runPCA(data: tf.Tensor2D, numComponents: number = 2): Promise<number[][]> {
    return tf.tidy(() => {
        const centered = data.sub(data.mean(0));
        const { s, u, v } = tf.linalg.svd(centered);
        const principalComponents = u.matMul(tf.diag(s));
        return principalComponents.slice([0, 0], [-1, numComponents]).arraySync() as number[][];
    });
}

async function runUMAP(data: number[][]): Promise<number[][]> {
    const umap = new UMAP({
        nNeighbors: 15,
        minDist: 0.1,
        nComponents: 2,
    });
    const embedding = await umap.fitAsync(data);
    return embedding;
}

export async function runEmbedding() {
    const { data, embeddingMethod, setEmbedding, setTrainingState, pcaComponents, selectedDataset } = useStore.getState();
    if (!data.tensor) return;
    
    if (selectedDataset !== "Iris" && data.precomputed_embedding) {
        setTrainingState({ isRunning: true, statusText: `Loading precomputed UMAP...` });
        setEmbedding(data.precomputed_embedding);
        useStore.setState({ selectedModel: Model.Embedding });
        setTrainingState({ isRunning: false, statusText: 'Embedding ready' });
        return;
    }

    setTrainingState({ isRunning: true, statusText: `Running ${embeddingMethod}...` });
    
    try {
        let finalEmbedding: number[][] | null = null;
        if (embeddingMethod === EmbeddingMethod.PCA) {
            finalEmbedding = await runPCA(data.tensor, 2);
        } else if (embeddingMethod === EmbeddingMethod.UMAP) {
            let dataForUmap: number[][] | tf.Tensor2D = data.tensor;
            if (data.tensor.shape[1] > pcaComponents) {
                setTrainingState({ statusText: `Running PCA (${pcaComponents} comps)...` });
                dataForUmap = await runPCA(data.tensor, pcaComponents);
            } else {
                 dataForUmap = data.tensor.arraySync() as number[][];
            }
            setTrainingState({ statusText: 'Running UMAP...' });
            finalEmbedding = await runUMAP(dataForUmap);
        }

        setEmbedding(finalEmbedding);
    } catch (error) {
        console.error("Embedding failed:", error);
        setTrainingState({ statusText: `Error during ${embeddingMethod}` });
    } finally {
        setTrainingState({ isRunning: false, statusText: 'Embedding ready' });
    }
}
