import React, { useState } from 'react';
import VaultHomePage from './VaultHomePage';
import EncryptionDashboard from './EncryptionDashboard';
import DecryptionDashboard from './DecryptionDashboard';
import type { Page } from '../types';

const Vault: React.FC = () => {
    const [page, setPage] = useState<Page>('home');

    const renderPage = () => {
        switch (page) {
            case 'encrypt':
                return <EncryptionDashboard onNavigate={setPage} />;
            case 'decrypt':
                return <DecryptionDashboard onNavigate={setPage} />;
            case 'home':
            default:
                return <VaultHomePage onNavigate={setPage} />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            {renderPage()}
        </div>
    );
};

export default Vault;
