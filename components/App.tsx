
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Vault from './components/Vault';

const NavItem: React.FC<{
  // FIX: Explicitly type the icon prop to accept a className.
  // This resolves a TypeScript error when using React.cloneElement to add classes to the SVG icon.
  // The original type `React.ReactElement` was too generic, and TypeScript couldn't infer that the element accepts a `className`.
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, isCollapsed, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium w-full transition-colors ${
      isActive
        ? 'bg-cyan-500/20 text-cyan-300'
        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
    } ${isCollapsed ? 'justify-center space-x-0' : 'space-x-3'}`}
  >
    {React.cloneElement(icon, { className: 'h-5 w-5 flex-shrink-0' })}
    <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'vault':
        return <Vault />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex">
      <aside className={`bg-slate-900/70 backdrop-blur-lg border-r border-slate-800 flex-shrink-0 flex flex-col p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center p-3 mb-6 transition-all duration-200 ${isCollapsed ? 'justify-center space-x-0' : 'space-x-3'}`}>
           <svg className="w-8 h-8 text-cyan-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h4.5M12 3v5.25m-1.879-1.121 4.242 4.242" />
            </svg>
            <h1 className={`text-xl font-bold text-slate-100 whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>System Suite</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          <NavItem
            label="Dashboard"
            isActive={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
            isCollapsed={isCollapsed}
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>}
          />
          <NavItem
            label="Secure Vault"
            isActive={activeView === 'vault'}
            onClick={() => setActiveView('vault')}
            isCollapsed={isCollapsed}
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>}
          />
        </nav>
        <div className="mt-auto pt-4">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-full px-3 py-2.5 rounded-md text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> :
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              }
            </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 h-full">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
