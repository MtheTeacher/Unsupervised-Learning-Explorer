

export function calculatePurityAndConfusion(clusterAssignments: number[], trueLabels: number[]) {
    if (clusterAssignments.length !== trueLabels.length) {
        throw new Error("Input arrays must have the same length.");
    }
    
    const numClusters = Math.max(...clusterAssignments) + 1;
    const numClasses = Math.max(...trueLabels) + 1;
    
    const confusionMatrix: number[][] = Array(numClusters).fill(0).map(() => Array(numClasses).fill(0));
    
    for (let i = 0; i < clusterAssignments.length; i++) {
        confusionMatrix[clusterAssignments[i]][trueLabels[i]]++;
    }
    
    let totalMax = 0;
    for (let i = 0; i < numClusters; i++) {
        totalMax += Math.max(...confusionMatrix[i]);
    }
    
    const purity = totalMax / clusterAssignments.length;
    
    return { purity, confusionMatrix };
}
