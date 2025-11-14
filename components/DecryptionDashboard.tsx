import React, { useState, useCallback } from 'react';
import type { Page, VaultContent, VaultFile } from '../types';
import { decryptAndUnpackage } from '../services/appServices';

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
                className="w-full p-3 pr-10 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200"
                aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
                {isVisible ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67 .127 2.454 .364m-6.082 11.45a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 1.414l-1.414 1.414zM12 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>}
            </button>
        </div>
    );
};

const base64ToBlob = (base64: string, type: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
};

const DecryptionDashboard: React.FC<{onNavigate: (page: Page) => void}> = ({ onNavigate }) => {
    const [vaultFile, setVaultFile] = useState<File | null>(null);
    const [keyFile, setKeyFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decryptedContent, setDecryptedContent] = useState<VaultContent | null>(null);

    const handleDecrypt = useCallback(async () => {
        if (!vaultFile || !keyFile || !password) {
            setError('Please provide the vault file, key file, and password.');
            return;
        }
        setError(null);
        setIsDecrypting(true);
        setDecryptedContent(null);

        try {
            const keyJsonString = await keyFile.text();
            const decrypted = await decryptAndUnpackage(vaultFile, keyJsonString, password);
            setDecryptedContent(decrypted);
        } catch (err: any) {
            console.error("Decryption failed:", err);
            setError(`Decryption failed: ${err.message}`);
        } finally {
            setIsDecrypting(false);
        }
    }, [vaultFile, keyFile, password]);

    const handleDownload = (file: VaultFile) => {
        const blob = base64ToBlob(file.data, file.type);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (decryptedContent) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
                <button onClick={() => setDecryptedContent(null)} className="text-cyan-400 hover:text-cyan-300">&larr; Decrypt Another Vault</button>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-green-400 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Vault Opened Successfully</h2>
                    {decryptedContent.note && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">Secure Note</h3>
                            <pre className="w-full h-40 p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-200 whitespace-pre-wrap font-sans">{decryptedContent.note}</pre>
                        </div>
                    )}
                    {decryptedContent.files.length > 0 && (
                        <div>
                             <h3 className="text-lg font-semibold text-slate-300 mb-2">Files</h3>
                             <ul className="space-y-2">
                                {decryptedContent.files.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm text-slate-300 bg-slate-700 p-2 rounded-md">
                                        <span className="truncate pr-4">{file.name}</span>
                                        <button onClick={() => handleDownload(file)} className="text-cyan-400 hover:text-cyan-300 font-semibold">Download</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-xl mx-auto p-6 space-y-6">
            <button onClick={() => onNavigate('home')} className="text-cyan-400 hover:text-cyan-300">&larr; Back to Vault Home</button>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white">Open an Existing Vault</h2>
                
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="vault-file" className="block text-sm font-medium text-slate-300 mb-2">1. Upload Vault File</label>
                        <input id="vault-file" type="file" accept=".aescrypt" onChange={e => setVaultFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="key-file" className="block text-sm font-medium text-slate-300 mb-2">2. Upload Key File</label>
                        <input id="key-file" type="file" accept=".json" onChange={e => setKeyFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-700"/>
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">3. Enter Password</label>
                        <PasswordInput id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter vault password" disabled={isDecrypting} />
                    </div>
                </div>

                 {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm">{error}</p>}

                <button
                    onClick={handleDecrypt}
                    disabled={isDecrypting || !vaultFile || !keyFile || !password}
                    className="w-full flex justify-center items-center py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors"
                >
                    {isDecrypting ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Decrypting...
                        </>
                    ) : "Decrypt & Open Vault"}
                </button>
            </div>
        </div>
    );
};

export default DecryptionDashboard;
