import React from 'react';
import type { Page } from '../types';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <header className="mb-10">
        <svg className="w-24 h-24 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        <h1 className="text-5xl font-bold text-white tracking-tight">Secure Vault</h1>
        <p className="text-gray-400 mt-4 text-lg">Client-side file encryption. Your data never leaves your browser.</p>
      </header>

      <main className="space-y-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8">
        <p className="text-gray-300">
            Choose an option below to get started. All encryption and decryption is performed securely on your device.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
            <button
            onClick={() => onNavigate('encrypt')}
            className="flex-1 px-6 py-4 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors duration-200"
            >
            Create New Vault
            </button>
            <button
            onClick={() => onNavigate('decrypt')}
            className="flex-1 px-6 py-4 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-colors duration-200"
            >
            Open Existing Vault
            </button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
