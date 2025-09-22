import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Model } from '../types';
import { LineChart } from './LineChart';
import { calculatePurityAndConfusion } from '../services/metricsService';
import { Tooltip } from './common/Tooltip';

export const MetricsPanel: React.FC = () => {
    const { selectedModel, groundTruthRevealed } = useStore();

    return (
        <div className="bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 h-full max-h-[calc(100vh-14rem)] flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-white/20 pb-2">Metrics</h2>
            <div className="flex-grow overflow-y-auto pr-2">
                {selectedModel === Model.KMeans && <KMeansMetrics />}
                {selectedModel === Model.Embedding && groundTruthRevealed && <GroundTruthMetrics />}
                {selectedModel === Model.Autoencoder && <AutoencoderMetrics />}

                {selectedModel !== Model.Autoencoder && !groundTruthRevealed && (
                    <div className="text-center text-gray-400 mt-8">
                        <p>Run a model to see metrics.</p>
                        <p className="mt-4 text-sm">For ground truth comparison, press 'Reveal Ground Truth' after clustering.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricDisplay: React.FC<{ label: string; value: string | number | null; tooltip?: string }> = ({ label, value, tooltip }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/20">
        <span className="text-gray-300 flex items-center">{label} {tooltip && <Tooltip text={tooltip} />}</span>
        <span className="font-mono font-semibold text-lg text-white">{value ?? 'N/A'}</span>
    </div>
);

const KMeansMetrics: React.FC = () => {
    const { kmeansResults, elbowData, groundTruthRevealed } = useStore();

    return (
        <div>
            <h3 className="font-semibold text-lg mb-2 text-white">Clustering Quality</h3>
            <MetricDisplay 
                label="SSE" 
                value={kmeansResults.sse ? kmeansResults.sse.toExponential(2) : null}
                tooltip="Sum of Squared Errors. Lower is better."
            />
            {groundTruthRevealed && <GroundTruthMetrics />}

            {elbowData.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-2 text-white">Elbow Method</h3>
                    <div className="h-64">
                       <LineChart 
                           data={elbowData.map(d => ({ x: d.k, y: d.sse }))}
                           title="Elbow Plot for Optimal k"
                           xLabel="Number of Clusters (k)"
                           yLabel="SSE"
                           color="#f97316"
                       />
                    </div>
                </div>
            )}
        </div>
    );
};

const AutoencoderMetrics: React.FC = () => {
    const lossHistory = useStore(state => state.aeLossHistory);
    const finalLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : null;

    return (
        <div>
            <h3 className="font-semibold text-lg mb-2 text-white">Training Performance</h3>
            <MetricDisplay
                label="Final Loss (MSE)"
                value={finalLoss ? finalLoss.toFixed(5) : null}
                tooltip="Mean Squared Error between original and reconstructed data. Lower is better."
            />
        </div>
    );
};

const GroundTruthMetrics: React.FC = () => {
    const { data, kmeansResults } = useStore();
    const { purity, confusionMatrix } = useMemo(() => {
        if (data.labels && kmeansResults.assignments) {
            return calculatePurityAndConfusion(kmeansResults.assignments, data.labels);
        }
        return { purity: null, confusionMatrix: null };
    }, [data.labels, kmeansResults.assignments]);

    return (
        <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2 border-t border-white/20 pt-4 text-white">Ground Truth Comparison</h3>
            <MetricDisplay 
                label="Purity" 
                value={purity ? purity.toFixed(3) : null}
                tooltip="Measures the extent to which clusters contain a single class. Higher is better (max 1.0)."
            />
            {confusionMatrix && <ConfusionMatrixDisplay matrix={confusionMatrix} />}
        </div>
    );
};

const ConfusionMatrixDisplay: React.FC<{matrix: number[][]}> = ({matrix}) => {
    return (
        <div className="mt-4">
            <h4 className="text-sm text-gray-400 mb-2">Confusion Matrix (Cluster vs. Label)</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                    <thead>
                        <tr>
                            <th className="p-1 border border-white/20 bg-white/10"></th>
                            {matrix[0]?.map((_, i) => <th key={i} className="p-1 border border-white/20 bg-white/10">Label {i}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i}>
                                <th className="p-1 border border-white/20 bg-white/10">Cluster {i}</th>
                                {row.map((val, j) => <td key={j} className="p-1 border border-white/20 font-mono">{val}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}