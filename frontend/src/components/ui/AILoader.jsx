import { useState, useEffect } from 'react';
import { Brain, Sparkles, Zap } from 'lucide-react';

const aiLoaderMessages = [
  "Consulting the neural networks...",
  "Teaching a machine how to dream...",
  "Mixing pixels and imagination...",
  "Decoding the prompt's hidden layers...",
  "Asking the latent space for directions...",
  "Polishing the artificial synapses...",
  "Synthesizing creative sparks...",
  "Training the ghosts in the machine...",
  "Converting coffee into cold, hard logic...",
  "Painting with math...",
  "Extracting wisdom from a billion parameters...",
  "Fine-tuning the vibe...",
  "Whispering to the GPU clusters...",
  "Simulating a moment of inspiration...",
  "Gathering digital stardust...",
  "Filtering out the hallucinations (mostly)...",
  "Navigating the high-dimensional vectors...",
  "Wait while we teach the silicon to feel...",
  "Defragmenting the creative flow...",
  "Finalizing the masterpiece..."
];

const AILoader = ({ isOpen }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % aiLoaderMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping"></div>
            <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-400 dark:to-primary-600 rounded-full p-6 shadow-lg">
              <Brain className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500 dark:text-primary-400" />
              Design is being generated...
              <Sparkles className="w-5 h-5 text-primary-500 dark:text-primary-400" />
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Generating your interior design...</p>
          </div>

          {/* Cycling Message */}
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 rounded-xl p-4 border border-primary-200 dark:border-primary-800 w-full">
            <p className="text-base font-medium text-primary-900 dark:text-primary-100 min-h-[60px] flex items-center justify-center transition-all duration-500">
              <Zap className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400 animate-bounce" />
              {aiLoaderMessages[currentMessageIndex]}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Processing</span>
              <span>AI Model</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            "Design is intelligence made visible"
          </p>
        </div>
      </div>
    </div>
  );
};

export default AILoader;
