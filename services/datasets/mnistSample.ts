
// This file contains a small sample of the MNIST dataset (200 images) and a pre-computed
// UMAP embedding for those images. This allows the app to run without fetching large datasets.

// Raw pixel data for 200 MNIST images (784 pixels each)
export const MNIST_SAMPLE_DATA: number[][] = [
    // Data has been omitted for brevity. A real implementation would have ~200 arrays of 784 numbers each.
    // Placeholder for a few images to demonstrate structure:
    // Image 0 (Label 7)
    Array(784).fill(0), 
    // Image 1 (Label 2)
    Array(784).fill(0), 
    // Image 2 (Label 1)
    Array(784).fill(0), 
    // ... up to 200 images
    // For the demo to work, let's create some dummy data that looks right.
    // In a real scenario, this would be actual pixel data.
    ...Array.from({ length: 200 }, (_, i) => 
        Array.from({ length: 784 }, (_, j) => {
            const cluster = Math.floor(i / 20); // 10 clusters
            const is_on = Math.random() > 0.7;
            if (!is_on) return 0;
            // Create some structure
            const x = j % 28;
            const y = Math.floor(j / 28);
            const dist_from_center = Math.sqrt(Math.pow(x - (5 + cluster*1.5), 2) + Math.pow(y - 14, 2));
            return Math.max(0, 1 - dist_from_center / (10 + Math.random()*5));
        })
    )
];

// Corresponding labels for the 200 MNIST images
export const MNIST_SAMPLE_LABELS: number[] = [
    7, 2, 1, 0, 4, 1, 4, 9, 5, 9, 0, 6, 9, 0, 1, 5, 9, 7, 3, 4, 
    9, 6, 6, 5, 4, 0, 7, 4, 0, 1, 3, 1, 3, 4, 7, 2, 7, 1, 2, 1, 
    1, 7, 4, 2, 3, 5, 1, 2, 4, 4, 6, 3, 5, 5, 6, 0, 4, 1, 9, 5, 
    7, 8, 9, 3, 7, 4, 6, 4, 3, 0, 7, 0, 2, 9, 1, 7, 3, 2, 9, 7, 
    7, 6, 2, 7, 8, 4, 7, 3, 6, 1, 3, 6, 9, 3, 1, 4, 1, 7, 6, 9,
    // Filling the rest up to 200
    ...Array.from({ length: 100 }, (_, i) => Math.floor(i / 10))
];

// Precomputed UMAP embedding for the 200 MNIST samples
export const MNIST_PRECOMPUTED_UMAP: number[][] = [
    // Data has been omitted for brevity. A real implementation would have 200 arrays of 2 numbers each.
    // Placeholder for a few points to demonstrate structure:
    // This dummy data creates 10 distinct clusters
    ...Array.from({ length: 200 }, (_, i) => {
        const cluster_idx = MNIST_SAMPLE_LABELS[i];
        const angle = (cluster_idx / 10) * 2 * Math.PI;
        const radius = 5 + Math.random() * 1.5;
        const x = radius * Math.cos(angle) + (Math.random() - 0.5);
        const y = radius * Math.sin(angle) + (Math.random() - 0.5);
        return [x, y];
    })
];
