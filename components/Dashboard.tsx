import React, { useState, useEffect, useCallback } from 'react';
import type { MonitoredEndpoint } from '../types';

// --- New System Info Widget ---
interface SysInfo {
  os: string;
  browser: string;
  cpuCores?: number;
  memory?: number; // in GB
  resolution: string;
}

const InfoItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <li className="flex justify-between items-baseline py-1.5 border-b border-slate-700/50">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-200">{value || 'N/A'}</span>
    </li>
);

const SystemInformation: React.FC = () => {
    const [info, setInfo] = useState<SysInfo | null>(null);

    useEffect(() => {
        const ua = navigator.userAgent;
        let os = "Unknown OS";
        if (ua.includes("Win")) os = "Windows";
        if (ua.includes("Mac")) os = "MacOS";
        if (ua.includes("Linux")) os = "Linux";
        if (ua.includes("Android")) os = "Android";
        if (ua.includes("like Mac") && ua.includes("iPhone")) os = "iOS";

        let browser = "Unknown Browser";
        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Edg")) browser = "Edge";
        
        // @ts-ignore - deviceMemory is experimental and not in all TS lib versions
        const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : undefined;

        setInfo({
            os,
            browser,
            cpuCores: navigator.hardwareConcurrency,
            // @ts-ignore
            memory: navigator.deviceMemory,
            resolution: `${window.screen.width}x${window.screen.height}`
        });
    }, []);

    if (!info) return null;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col h-full">
            <h3 className="text-slate-300 font-semibold mb-2">System Information</h3>
            <div className="flex-grow">
                <ul className="space-y-1 text-sm">
                    <InfoItem label="Operating System" value={info.os} />
                    <InfoItem label="Browser" value={info.browser} />
                    <InfoItem label="Logical CPU Cores" value={info.cpuCores} />
                    <InfoItem label="Device Memory (Approx.)" value={info.memory ? `${info.memory} GB` : undefined} />
                    <InfoItem label="Screen Resolution" value={info.resolution} />
                </ul>
            </div>
            <div className="mt-4 p-3 bg-slate-900/50 rounded-md text-xs text-slate-400">
                <p>
                    <strong className="text-slate-300">Note:</strong> Live metrics like real-time CPU/Memory usage require native system access, which browsers restrict for security. A native companion app is needed to display performance data.
                </p>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const [urlInput, setUrlInput] = useState('https://api.aistudio.google.com/v1');
    const [monitoredEndpoints, setMonitoredEndpoints] = useState<MonitoredEndpoint[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<MonitoredEndpoint | null>(null);

    const handlePing = useCallback(async () => {
        if (!urlInput.trim()) return;

        let url = urlInput.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        const endpointId = Date.now().toString();
        const newEndpoint: MonitoredEndpoint = {
            id: endpointId,
            url,
            status: 'Pending',
            timestamp: new Date().toLocaleTimeString(),
        };
        
        setMonitoredEndpoints(prev => [newEndpoint, ...prev].slice(0, 50)); // Keep last 50
        setUrlInput('');

        const startTime = Date.now();
        try {
            // NOTE: This fetch request is subject to CORS policy.
            const response = await fetch(url, { mode: 'cors' });
            const latency = Date.now() - startTime;
            const body = await response.text();
            
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            const updatedEndpoint: MonitoredEndpoint = {
                ...newEndpoint,
                status: response.ok ? 'OK' : 'Error',
                statusCode: response.status,
                latency,
                bodyPreview: body.substring(0, 500),
                headers
            };
            setMonitoredEndpoints(prev => prev.map(e => e.id === endpointId ? updatedEndpoint : e));
        } catch (error: any) {
             const latency = Date.now() - startTime;
             const errorMessage = error.message.includes('Failed to fetch') 
                ? 'Network Error (Check CORS or connectivity)'
                : error.message;

             const updatedEndpoint: MonitoredEndpoint = {
                ...newEndpoint,
                status: 'Error',
                latency,
                error: errorMessage,
            };
             setMonitoredEndpoints(prev => prev.map(e => e.id === endpointId ? updatedEndpoint : e));
        }
    }, [urlInput]);

    const getStatusColor = (status: 'OK' | 'Error' | 'Pending') => {
        switch (status) {
            case 'OK': return 'bg-green-500/20 text-green-400';
            case 'Error': return 'bg-red-500/20 text-red-400';
            case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <header className="mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-100">System Dashboard</h2>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
                <div className="lg:w-[400px] flex-shrink-0">
                  <SystemInformation />
                </div>
                
                <div className="flex-grow min-w-0">
                     <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
                         <h3 className="text-slate-300 font-semibold mb-3 flex-shrink-0">Live Network Monitor</h3>
                         <div className="flex gap-2 mb-3 flex-shrink-0">
                            <input
                                type="text"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handlePing()}
                                placeholder="Enter a URL to monitor..."
                                className="flex-grow p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                            />
                            <button onClick={handlePing} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                Ping
                            </button>
                         </div>
                         <div className="flex-grow overflow-y-auto min-h-0">
                            <table className="w-full text-left text-sm">
                              <thead className="sticky top-0 bg-slate-800/80 backdrop-blur-sm">
                                <tr>
                                  <th className="p-2 text-slate-400 font-medium">URL</th>
                                  <th className="p-2 text-slate-400 font-medium">Status</th>
                                  <th className="p-2 text-slate-400 font-medium text-right">Latency</th>
                                  <th className="p-2 text-slate-400 font-medium"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700/50">
                                {monitoredEndpoints.map(e => (
                                  <tr key={e.id} className="hover:bg-slate-700/30">
                                    <td className="p-2 font-mono truncate max-w-xs">{e.url}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(e.status)}`}>
                                            {e.status} {e.statusCode && `(${e.statusCode})`}
                                        </span>
                                    </td>
                                    <td className="p-2 font-mono text-right">{e.latency != null ? `${e.latency}ms` : 'N/A'}</td>
                                    <td className="p-2 text-right"><button onClick={() => setSelectedEndpoint(e)} className="text-cyan-400 hover:text-cyan-300 text-xs">Details</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        
            {selectedEndpoint && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedEndpoint(null)}>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-cyan-400 truncate pr-4">{selectedEndpoint.url}</h2>
                            <button onClick={() => setSelectedEndpoint(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto">
                           <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedEndpoint.status)}`}>{selectedEndpoint.status} {selectedEndpoint.statusCode && `(${selectedEndpoint.statusCode})`}</span></p>
                           <p><strong>Latency:</strong> <span className="font-mono">{selectedEndpoint.latency}ms</span></p>
                           <p><strong>Timestamp:</strong> <span className="font-mono">{selectedEndpoint.timestamp}</span></p>
                           {selectedEndpoint.error && <p><strong>Error:</strong> <span className="font-mono text-red-400">{selectedEndpoint.error}</span></p>}
                           
                           {selectedEndpoint.headers && (
                             <div>
                                <h4 className="font-semibold text-slate-300 mb-2">Response Headers:</h4>
                                <pre className="bg-slate-900/50 p-3 rounded-md text-slate-400 text-xs overflow-x-auto">
                                    {JSON.stringify(selectedEndpoint.headers, null, 2)}
                                </pre>
                            </div>
                           )}
                           {selectedEndpoint.bodyPreview && (
                             <div>
                                <h4 className="font-semibold text-slate-300 mb-2">Response Body Preview:</h4>
                                <pre className="bg-slate-900/50 p-3 rounded-md text-slate-400 text-xs overflow-x-auto whitespace-pre-wrap">
                                    {selectedEndpoint.bodyPreview}
                                </pre>
                            </div>
                           )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;