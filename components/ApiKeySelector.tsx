import React, { useState, useCallback } from 'react';
import type { Page, VaultContent, VaultFile } from '../types';
import { encryptAndPackage } from '../services/geminiService'; // Repurposed for cryptoService

interface EncryptionDashboardProps {
  onNavigate: (page: Page) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

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


const EncryptionDashboard: React.FC<EncryptionDashboardProps> = ({ onNavigate }) => {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(event.target.files!)]);
    }
  };

  const handleEncrypt = useCallback(async () => {
    if (!note.trim() && files.length === 0) {
      setError('Please add a note or at least one file to encrypt.');
      return;
    }
    if (!password) {
        setError('A password is required to secure your vault key.');
        return;
    }
    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setIsEncrypting(true);

    try {
      const filePromises = files.map(async (file): Promise<VaultFile> => {
        const data = await fileToBase64(file);
        return { name: file.name, type: file.type, data };
      });

      const processedFiles = await Promise.all(filePromises);
      const vaultContent: VaultContent = { note, files: processedFiles };
      
      const { encryptedBlob, keyJsonString } = await encryptAndPackage(vaultContent, password);
      
      const keyBlob = new Blob([keyJsonString], { type: 'application/json' });

      triggerDownload(encryptedBlob, 'encrypted-vault.aescrypt');
      triggerDownload(keyBlob, 'vault-key.json');

    } catch (err: any) {
        console.error("Encryption failed:", err);
        setError(`Encryption failed: ${err.message}`);
    } finally {
        setIsEncrypting(false);
    }
  }, [note, files, password, confirmPassword]);

  const isButtonDisabled = isEncrypting || (!note.trim() && files.length === 0) || !password || password !== confirmPassword;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
       <button onClick={() => onNavigate('home')} className="text-blue-400 hover:text-blue-300">&larr; Back to Home</button>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-white">Create a New Secure Vault</h2>
        
        <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-300 mb-2">Secure Note (Optional)</label>
            <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write any sensitive information here..."
                className="w-full h-40 p-3 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={isEncrypting}
            />
        </div>

        <div>
            <label htmlFor="files" className="block text-sm font-medium text-gray-300 mb-2">Upload Files (Optional)</label>
            <input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
                disabled={isEncrypting}
            />
            {files.length > 0 && (
                <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                        <li key={index} className="text-sm text-gray-300 bg-gray-700 p-2 rounded-md">{file.name}</li>
                    ))}
                </ul>
            )}
        </div>

        <hr className="border-gray-600" />
        
        <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white">Set a Password</h3>
             <p className="text-sm text-gray-400">This password protects your vault key. You will need it to decrypt your vault later. <strong className="text-yellow-400">Do not forget it.</strong></p>
             <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password (min. 8 characters)</label>
                <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a strong password" disabled={isEncrypting} />
            </div>
             <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <PasswordInput id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" disabled={isEncrypting} />
            </div>
        </div>

        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</p>}

        <button
            onClick={handleEncrypt}
            disabled={isButtonDisabled}
            className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors"
        >
            {isEncrypting ? (
                 <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Encrypting...
                </>
            ) : "Encrypt & Download Vault"}
        </button>
      </div>
    </div>
  );
};

export default EncryptionDashboard;