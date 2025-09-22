import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { VisualizationPanel } from './components/VisualizationPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { useStore } from './store/useStore';
import * as tf from '@tensorflow/tfjs';

const App: React.FC = () => {
  const { setTfBackend, setAppReady, loadInitialData } = useStore();

  useEffect(() => {
    const initializeApp = async () => {
      await tf.ready();
      await tf.setBackend('webgl'); 
      setTfBackend(tf.getBackend());
      console.log(`TensorFlow.js backend set to: ${tf.getBackend()}`);
      
      // Load default dataset
      await loadInitialData();

      setAppReady(true);
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen text-gray-300 flex flex-col bg-black/60 backdrop-blur-sm">
      <Header />
      <main className="flex-grow p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-3 h-full">
          <ControlPanel />
        </div>
        <div className="lg:col-span-6 h-full">
          <VisualizationPanel />
        </div>
        <div className="lg:col-span-3 h-full">
          <MetricsPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Footer: React.FC = () => {
  const tfBackend = useStore(state => state.tfBackend);
  const isAppReady = useStore(state => state.isAppReady);

  return (
    <footer className="px-8 py-2 text-center text-xs text-gray-400 border-t border-white/20">
      Unsupervised Learning Explorer | {isAppReady ? `TensorFlow.js Backend: ${tfBackend.toUpperCase()}` : 'Initializing App...'}
    </footer>
  );
};

export default App;