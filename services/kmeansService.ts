
import * as tf from '@tensorflow/tfjs';
import { useStore } from '../store/useStore';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// k-Means++ initialization
function initializeCentroids(data: tf.Tensor2D, k: number): tf.Tensor2D {
    return tf.tidy(() => {
        const numSamples = data.shape[0];
        const centroids: tf.Tensor2D[] = [];

        // 1. Choose one center uniformly at random from among the data points.
        const firstCentroidIndex = Math.floor(Math.random() * numSamples);
        let firstCentroid = data.slice([firstCentroidIndex, 0], [1, -1]);
        centroids.push(firstCentroid as tf.Tensor2D);

        // 2. For each data point x, compute D(x), the distance between x and the nearest center that has already been chosen.
        let distances = tf.squaredDifference(data, centroids[0]).sum(1);

        for (let i = 1; i < k; i++) {
            // 3. Choose one new data point at random as a new center, using a weighted probability distribution where a point x is chosen with probability proportional to D(x)^2.
            const probabilities = distances.div(distances.sum());
            const nextCentroidIndex = tf.multinomial(probabilities, 1).dataSync()[0];
            const nextCentroid = data.slice([nextCentroidIndex, 0], [1, -1]);
            centroids.push(nextCentroid as tf.Tensor2D);
            
            // Update distances
            const newDistances = tf.squaredDifference(data, nextCentroid).sum(1);
            distances = tf.minimum(distances, newDistances);
        }
        
        return tf.concat(centroids, 0);
    });
}


async function kMeansStep(data: tf.Tensor2D, centroids: tf.Tensor2D) {
    return tf.tidy(() => {
        // Assignment step
        const expandedData = data.expandDims(1);
        const expandedCentroids = centroids.expandDims(0);
        const distances = tf.squaredDifference(expandedData, expandedCentroids).sum(2);
        const assignments = distances.argMin(1);
        
        // Update step
        const k = centroids.shape[0];
        const newCentroids: tf.Tensor2D[] = [];
        let totalSSE = 0;
        
        for (let i = 0; i < k; i++) {
            const clusterPoints = data.gather(tf.where(tf.equal(assignments, i)).squeeze(1));
            const numPoints = clusterPoints.shape[0];

            if (numPoints > 0) {
                const mean = clusterPoints.mean(0, true) as tf.Tensor2D;
                newCentroids.push(mean);
                const clusterSSE = tf.squaredDifference(clusterPoints, mean).sum().dataSync()[0];
                totalSSE += clusterSSE;
            } else {
                // If a cluster is empty, re-initialize its centroid
                newCentroids.push(data.slice([Math.floor(Math.random() * data.shape[0]), 0], [1, -1]) as tf.Tensor2D);
            }
        }
        
        return { 
            newCentroids: tf.concat(newCentroids), 
            assignments, 
            sse: totalSSE 
        };
    });
}

export async function runKMeans() {
    const { data, k, setKMeansResults, setTrainingState } = useStore.getState();
    if (!data.tensor) return;

    setTrainingState({ isRunning: true, statusText: 'Initializing k-means...', currentIteration: 0 });

    let centroids = initializeCentroids(data.tensor, k);
    
    for (let i = 0; i < 20; i++) {
        if (!useStore.getState().trainingState.isRunning) break;
        
        setTrainingState({ statusText: `Iteration ${i + 1}/20`, currentIteration: i + 1 });
        
        const { newCentroids, assignments, sse } = await kMeansStep(data.tensor, centroids);
        
        const assignmentsArray = await assignments.array();
        const centroidsArray = await newCentroids.array() as number[][];
        
        tf.dispose(centroids);
        centroids = newCentroids;
        assignments.dispose();
        
        setKMeansResults({ assignments: assignmentsArray, centroids: centroidsArray, sse });
        
        await sleep(200); // For animation
    }
    
    tf.dispose(centroids);
    setTrainingState({ isRunning: false, statusText: 'k-means finished' });
}

export async function calculateElbow() {
    const { data, setElbowData, setTrainingState } = useStore.getState();
    if (!data.tensor) return;

    setTrainingState({ isRunning: true, statusText: 'Calculating Elbow Plot...' });
    setElbowData([]);

    for (let k_val = 2; k_val <= 10; k_val++) {
        if (!useStore.getState().trainingState.isRunning) break;
        setTrainingState({ statusText: `Testing k=${k_val}...` });
        
        let finalSSE = Infinity;
        // Run a few times for each k and take the best result to avoid bad initializations
        for (let run = 0; run < 3; run++) {
            let centroids = initializeCentroids(data.tensor, k_val);
            let sse = 0;
            for (let iter = 0; iter < 10; iter++) {
                const result = await kMeansStep(data.tensor, centroids);
                tf.dispose(centroids);
                centroids = result.newCentroids;
                sse = result.sse;
                result.assignments.dispose();
            }
            finalSSE = Math.min(finalSSE, sse);
            tf.dispose(centroids);
        }
        
        useStore.setState(state => ({ elbowData: [...state.elbowData, { k: k_val, sse: finalSSE }] }));
        await sleep(50);
    }
    
    setTrainingState({ isRunning: false, statusText: 'Elbow plot ready' });
}
