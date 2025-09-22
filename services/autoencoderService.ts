
import * as tf from '@tensorflow/tfjs';
import { useStore } from '../store/useStore';

function buildAutoencoder(inputShape: number, bottleneckSize: number) {
    const encoder = tf.sequential({
        layers: [
            tf.layers.dense({ inputShape: [inputShape], units: 128, activation: 'relu' }),
            tf.layers.dense({ units: 64, activation: 'relu' }),
            tf.layers.dense({ units: bottleneckSize, activation: 'relu' }),
        ]
    });

    const decoder = tf.sequential({
        layers: [
            tf.layers.dense({ inputShape: [bottleneckSize], units: 64, activation: 'relu' }),
            tf.layers.dense({ units: 128, activation: 'relu' }),
            tf.layers.dense({ units: inputShape, activation: 'sigmoid' }),
        ]
    });

    const autoencoder = tf.sequential({
        layers: [encoder, decoder]
    });

    return { autoencoder, encoder, decoder };
}

export async function runAutoencoderTraining() {
    const { data, aeBottleneck, aeEpochs, aeLearningRate, setTrainingState, setAeLossHistory, addAeLossPoint, setAeReconstructions } = useStore.getState();
    if (!data.tensor) return;
    
    setTrainingState({ isRunning: true, statusText: 'Building model...', maxEpochs: aeEpochs, currentEpoch: 0 });
    setAeLossHistory([]);
    setAeReconstructions(null);

    const inputShape = data.tensor.shape[1];
    const { autoencoder } = buildAutoencoder(inputShape, aeBottleneck);
    
    const optimizer = tf.train.adam(aeLearningRate);
    autoencoder.compile({ optimizer, loss: 'meanSquaredError' });
    
    const batchSize = 128;
    const trainingData = data.tensor.clone();

    for (let epoch = 1; epoch <= aeEpochs; epoch++) {
        if (!useStore.getState().trainingState.isRunning) break;

        setTrainingState({ currentEpoch: epoch, statusText: `Epoch ${epoch}/${aeEpochs}` });
        
        const history = await autoencoder.fit(trainingData, trainingData, {
            batchSize,
            epochs: 1,
            shuffle: true,
        });
        
        const loss = history.history.loss[0] as number;
        addAeLossPoint(loss);

        // Update reconstructions
        tf.tidy(() => {
            const numSamples = 16;
            const sampleData = trainingData.slice(0, numSamples);
            const reconstructedData = autoencoder.predict(sampleData) as tf.Tensor;
            setAeReconstructions({ original: tf.keep(sampleData.clone()), reconstructed: tf.keep(reconstructedData.clone())});
        });

        await tf.nextFrame(); // Yield to UI
    }

    setTrainingState({ isRunning: false, statusText: 'Autoencoder training finished' });
    autoencoder.dispose();
    optimizer.dispose();
    trainingData.dispose();
}
