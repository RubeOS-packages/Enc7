
// --- New Types for System Analysis Dashboard ---

export interface Process {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  status: 'Running' | 'Suspended';
}

export interface SystemMetricPoint {
  time: number; // timestamp
  value: number; // percentage
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}


// --- Types for Vault / Encryption feature ---
// FIX: Added missing Page type for navigation.
export type Page = 'home' | 'encrypt' | 'decrypt';

// FIX: Added missing VaultFile and VaultContent types for the encryption feature.
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

// FIX: Moved AIStudio interface into `declare global` and removed export to resolve declaration conflict error for window.aistudio.
// FIX: Refactored to define AIStudio interface outside of the global scope to prevent naming collisions.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}
