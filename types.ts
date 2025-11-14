// --- New Types for System Analysis Dashboard ---

// FIX: Added missing Process and LogEntry types used by geminiService.ts.
export interface Process {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: 'Running' | 'Suspended';
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface MonitoredEndpoint {
  id: string; // unique ID for mapping
  url: string;
  status: 'OK' | 'Error' | 'Pending';
  statusCode?: number;
  latency?: number; // in ms
  timestamp: string;
  headers?: Record<string, string>;
  bodyPreview?: string;
  error?: string;
}

// --- Types for Vault / Encryption feature ---
export type Page = 'home' | 'encrypt' | 'decrypt';

export interface VaultFile {
  name: string;
  type: string;
  data: string; // base64 string
}

export interface VaultContent {
  note: string;
  files: VaultFile[];
}


// --- Boilerplate AI Studio Types ---

// This makes AIStudio a global type and prevents conflicts when the file is included in multiple compilation contexts.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
