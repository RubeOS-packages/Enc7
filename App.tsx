import React, { useState, useCallback } from 'react';
import type { Page, VaultContent } from './types';
import HomePage from './components/VideoGenerator'; // Repurposed for HomePage
import EncryptionDashboard from './components/ApiKeySelector'; // Repurposed for EncryptionDashboard
import { unpackageAndDecrypt } from './services/geminiService'; // Repurposed for cryptoService

const PasswordInput: React.FC<{id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, disabled: boolean}> = ({ id, value, onChange, placeholder, disabled }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={isVisible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full p-3 pr-10 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-200"
                aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
                {isVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.127 2.454.364m-6.082 11.45a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 1.414l-1.414 1.414zM12 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                )}
            </button>
        </div>
    );
};

const DecryptionPage: React.FC<{ onNavigate: (page: Page) => void; }> = ({ onNavigate }) => {
    const [vaultFile, setVaultFile] = useState<File | null>(null);
    const [keyFile, setKeyFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decryptedContent, setDecryptedContent] = useState<VaultContent | null>(null);

    const handleDecrypt = useCallback(async () => {
        if (!vaultFile || !keyFile) {
            setError('Please select both a vault file and a key file.');
            return;
        }
        if (!password) {
            setError('A password is required to decrypt the vault.');
            return;
        }
        setError(null);
        setIsDecrypting(true);
        setDecryptedContent(null);

        try {
            const content = await unpackageAndDecrypt(vaultFile, keyFile, password);
            setDecryptedContent(content);
        } catch (err: any) {
            console.error("Decryption failed:", err);
            setError(`Decryption failed: ${err.message}. Please check if the files and password are correct.`);
        } finally {
            setIsDecrypting(false);
        }
    }, [vaultFile, keyFile, password]);

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            <button onClick={() => onNavigate('home')} className="text-blue-400 hover:text-blue-300">&larr; Back to Home</button>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white">Open an Encrypted Vault</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="vault-file" className="block text-sm font-medium text-gray-300 mb-2">1. Upload Vault File (.aescrypt)</label>
                        <input id="vault-file" type="file" accept=".aescrypt" onChange={(e) => setVaultFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500" />
                    </div>
                     <div>
                        <label htmlFor="key-file" className="block text-sm font-medium text-gray-300 mb-2">2. Upload Key File (.json)</label>
                        <input id="key-file" type="file" accept=".json" onChange={(e) => setKeyFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">3. Enter Password</label>
                    <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter the vault password" disabled={isDecrypting} />
                </div>
                 <button onClick={handleDecrypt} disabled={isDecrypting || !vaultFile || !keyFile || !password} className="w-full flex justify-center items-center py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-md transition-colors">
                    {isDecrypting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Decrypting...
                        </>
                    ) : 'Decrypt & View Content'}
                 </button>
                 {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</p>}
            </div>

            {decryptedContent && (
                 <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 space-y-6 mt-6">
                    <h3 className="text-xl font-bold text-white">Decrypted Content</h3>
                    <div>
                        <h4 className="font-semibold text-gray-300 mb-2">Note:</h4>
                        <p className="text-gray-200 bg-gray-900 p-4 rounded-md whitespace-pre-wrap">{decryptedContent.note || '(No note was saved)'}</p>
                    </div>
                    {decryptedContent.files.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Files:</h4>
                            <ul className="space-y-2">
                                {decryptedContent.files.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                                        <span className="text-sm text-gray-200">{file.name}</span>
                                        <a href={file.data} download={file.name} className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md">Download</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};


const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');

  const renderPage = () => {
    switch (page) {
      case 'encrypt':
        return <EncryptionDashboard onNavigate={setPage} />;
      case 'decrypt':
        return <DecryptionPage onNavigate={setPage} />;
      case 'home':
      default:
        return <HomePage onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      {renderPage()}
    </div>
  );
};

export default App;