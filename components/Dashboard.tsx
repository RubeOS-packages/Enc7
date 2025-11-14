import React, { useState, useEffect, useMemo } from 'react';
import type { Process, SystemMetricPoint, LogEntry } from '../types';
import { mockDataService } from '../services/appServices';

// --- SVG Chart Components (built for this dashboard) ---

const ChartWidget: React.FC<{ title: string; data: SystemMetricPoint[]; color: string }> = React.memo(({ title, data, color }) => {
    const SvgPath = useMemo(() => {
        if (data.length < 2) return '';
        const width = 300;
        const height = 100;
        const points = data.map((p, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (p.value / 100) * height;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        });
        return `M${points[0]} L${points.slice(1).join(' ')}`;
    }, [data]);

    const latestValue = data.length > 0 ? data[data.length - 1].value.toFixed(1) : '0.0';

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-slate-300 font-semibold">{title}</h3>
                <span className={`text-2xl font-bold text-${color}-400`}>{latestValue}%</span>
            </div>
            <div className="flex-grow flex items-center justify-center">
                <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                    <path d={SvgPath} stroke={`url(#gradient-${color})`} strokeWidth="2" fill="none" />
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color === 'cyan' ? '#22d3ee' : '#4ade80'} stopOpacity="0" />
                            <stop offset="100%" stopColor={color === 'cyan' ? '#22d3ee' : '#4ade80'} />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
});

const RadialWidget: React.FC<{ title: string; value: number; color: string }> = React.memo(({ title, value, color }) => {
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };
    
    const angle = (value / 100) * 359.99;
    const arcPath = describeArc(50, 50, 40, 0, angle);

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center h-full">
            <h3 className="text-slate-300 font-semibold mb-2">{title}</h3>
            <div className="relative w-32 h-32">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" strokeWidth="10" stroke="#334155" fill="none" />
                    <path d={arcPath} strokeWidth="10" stroke={color === 'sky' ? '#38bdf8' : '#fb923c'} fill="none" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold text-${color}-400`}>{value.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
});


const Dashboard: React.FC = () => {
    const [cpuData, setCpuData] = useState<SystemMetricPoint[]>([]);
    const [memData, setMemData] = useState<SystemMetricPoint[]>([]);
    const [diskIO, setDiskIO] = useState(0);
    const [processes, setProcesses] = useState<Process[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCpuData(prev => [...prev.slice(-29), { time: now, value: mockDataService.getMetricValue() }].sort((a,b) => a.time - b.time));
            setMemData(prev => [...prev.slice(-29), { time: now, value: mockDataService.getMetricValue(30, 80) }].sort((a,b) => a.time - b.time));
            setDiskIO(mockDataService.getMetricValue(5, 95));
            setProcesses(mockDataService.getProcesses());
            
            const newLog = mockDataService.getLogEntry();
            if (newLog) {
                 setLogs(prev => [newLog, ...prev.slice(0, 49)]);
            }

        }, 2000);

        // Initial data
        const initialTime = Date.now();
        const initialCpu: SystemMetricPoint[] = [];
        const initialMem: SystemMetricPoint[] = [];
        for(let i = 29; i >= 0; i--) {
            initialCpu.push({time: initialTime - i*2000, value: mockDataService.getMetricValue()});
            initialMem.push({time: initialTime - i*2000, value: mockDataService.getMetricValue(30, 80)});
        }
        setCpuData(initialCpu);
        setMemData(initialMem);
        setProcesses(mockDataService.getProcesses());
        setLogs(Array.from({length: 10}, () => mockDataService.getLogEntry(true)!));


        return () => clearInterval(interval);
    }, []);

    const getLogLevelColor = (level: 'INFO' | 'WARN' | 'ERROR') => {
        switch (level) {
            case 'INFO': return 'text-sky-400';
            case 'WARN': return 'text-yellow-400';
            case 'ERROR': return 'text-red-400';
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-full">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-100">System Dashboard</h2>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2"><ChartWidget title="CPU Usage" data={cpuData} color="cyan" /></div>
                <div className="lg:col-span-2"><ChartWidget title="Memory Usage" data={memData} color="green" /></div>
                
                <div className="lg:col-span-3">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 h-[28rem]">
                         <h3 className="text-slate-300 font-semibold mb-3">Running Processes</h3>
                         <div className="overflow-y-auto h-[calc(28rem-3rem)]">
                            <table className="w-full text-left text-sm">
                              <thead className="sticky top-0 bg-slate-800/50 backdrop-blur-sm">
                                <tr>
                                  <th className="p-2 text-slate-400 font-medium">PID</th>
                                  <th className="p-2 text-slate-400 font-medium">Process Name</th>
                                  <th className="p-2 text-slate-400 font-medium">User</th>
                                  <th className="p-2 text-slate-400 font-medium text-right">CPU %</th>
                                  <th className="p-2 text-slate-400 font-medium text-right">Mem %</th>
                                  <th className="p-2 text-slate-400 font-medium">Status</th>
                                  <th className="p-2 text-slate-400 font-medium"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700/50">
                                {processes.map(p => (
                                  <tr key={p.pid} className="hover:bg-slate-700/30">
                                    <td className="p-2 font-mono">{p.pid}</td>
                                    <td className="p-2 font-mono">{p.name}</td>
                                    <td className="p-2">{p.user}</td>
                                    <td className="p-2 font-mono text-right">{p.cpu.toFixed(2)}</td>
                                    <td className="p-2 font-mono text-right">{p.mem.toFixed(2)}</td>
                                    <td className="p-2"><span className={`px-2 py-1 text-xs rounded-full ${p.status === 'Running' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span></td>
                                    <td className="p-2 text-right"><button onClick={() => setSelectedProcess(p)} className="text-cyan-400 hover:text-cyan-300 text-xs">More Details</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-6">
                    <RadialWidget title="Disk I/O Activity" value={diskIO} color="sky" />
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex-grow">
                         <h3 className="text-slate-300 font-semibold mb-3">System Event Logs</h3>
                         <div className="overflow-y-auto h-40 space-y-2 text-xs font-mono pr-2">
                            {logs.map((log, i) => (
                                <p key={i}><span className="text-slate-500 mr-2">{log.timestamp}</span><span className={`${getLogLevelColor(log.level)} font-bold mr-2`}>{log.level}</span><span>{log.message}</span></p>
                            ))}
                         </div>
                    </div>
                </div>
            </main>
        
            {selectedProcess && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedProcess(null)}>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-cyan-400">{selectedProcess.name}</h2>
                            <button onClick={() => setSelectedProcess(null)} className="text-slate-400 hover:text-white">&times;</button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <p><strong>PID:</strong> <span className="font-mono">{selectedProcess.pid}</span></p>
                            <p><strong>User:</strong> <span className="font-mono">{selectedProcess.user}</span></p>
                            <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${selectedProcess.status === 'Running' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{selectedProcess.status}</span></p>
                            <p><strong>CPU Usage:</strong> <span className="font-mono">{selectedProcess.cpu.toFixed(2)}%</span></p>
                            <p><strong>Memory Usage:</strong> <span className="font-mono">{selectedProcess.mem.toFixed(2)}%</span></p>
                            <div className="pt-2">
                                <h4 className="font-semibold text-slate-300 mb-2">Mock Details:</h4>
                                <pre className="bg-slate-900/50 p-3 rounded-md text-slate-400 text-xs overflow-x-auto">
                                    PATH: /usr/bin/{selectedProcess.name.toLowerCase().split('.')[0]}<br/>
                                    START TIME: {new Date(Date.now() - Math.random() * 1000000).toUTCString()}<br/>
                                    NETWORK CONNECTIONS: {(Math.random() * 5).toFixed(0)} active<br/>
                                    OPEN FILES: {(Math.random() * 20).toFixed(0)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
