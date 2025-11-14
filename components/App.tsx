import React, { useState, useEffect, useCallback } from 'react';
// FIX: Corrected import paths for components in the same directory.
import VideoGenerator from './VideoGenerator';
import ApiKeySelector from './ApiKeySelector';

// Assume window.aistudio is available.
// The AIStudio interface and window.aistudio declaration are moved to types.ts to avoid conflicts.

// FIX: Removed AIStudio interface and global declaration from here to resolve global type conflicts. It is now in types.ts.

const App: React.FC = () => {
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
    } else {
      // Fallback for environments where aistudio is not present
      setIsKeySelected(!!process.env.API_KEY);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleKeySelected = () => {
    // Assume key selection is successful and immediately show the generator
    setIsKeySelected(true);
  };

  const resetKeySelection = () => {
    setIsKeySelected(false);
  };

  const renderContent = () => {
    if (isKeySelected === null) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-300">
          <div className="flex items-center space-x-2">
             <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
            <span>Checking API Key...</span>
          </div>
        </div>
      );
    }
    if (isKeySelected) {
      return <VideoGenerator onApiKeyError={resetKeySelection} />;
    }
    return <ApiKeySelector onKeySelected={handleKeySelected} />;
  };

  return <div className="min-h-screen bg-gray-900 text-white">{renderContent()}</div>;
};

export default App;