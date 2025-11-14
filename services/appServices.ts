import type { Process, LogEntry, VaultContent } from '../types';

const processNames = ['kernel_task', 'svchost.exe', 'systemd', 'chrome.exe', 'node', 'python3', 'containerd', 'dockerd', 'Code.exe', 'sshd', 'nginx', 'postgres'];
const users = ['root', 'system', 'window_manager', '_mysql', 'www-data', 'admin'];
const logMessages = [
    { level: 'INFO', msg: 'User login successful for `root` from 192.168.1.10' },
    { level: 'INFO', msg: 'Service `nginx` restarted successfully.' },
    { level: 'WARN', msg: 'High CPU usage detected on core 3.' },
    { level: 'WARN', msg: 'Disk space on `/var/log` is nearing capacity (92%).' },
    { level: 'ERROR', msg: 'Failed to connect to database: Connection timed out.' },
    { level: 'ERROR', msg: 'Unauthenticated access attempt blocked from 203.0.113.55.' },
    { level: 'INFO', msg: 'System update check complete. No new updates.'},
];

const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;
let pidCounter = 1000;

export const mockDataService = {
    getMetricValue: (min = 5, max = 85): number => {
        // Use a sine wave to make it look more organic
        const time = Date.now() / 10000;
        const sinWave = (Math.sin(time) + 1) / 2; // value between 0 and 1
        return getRandom(min, min + (max - min) * sinWave);
    },

    getProcesses: (): Process[] => {
        return processNames.map(name => ({
            pid: pidCounter++,
            name,
            user: users[Math.floor(Math.random() * users.length)],
            cpu: getRandom(0.1, 15),
            mem: getRandom(0.5, 10),
            status: (Math.random() > 0.1 ? 'Running' : 'Suspended') as Process['status'],
        })).sort((a,b) => b.cpu - a.cpu);
    },

    getLogEntry: (force = false): LogEntry | null => {
        if (Math.random() < 0.7 && !force) return null;
        
        const log = logMessages[Math.floor(Math.random() * logMessages.length)];
        return {
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            level: log.level as 'INFO' | 'WARN' | 'ERROR',
            message: log.msg,
        };
    }
};

export const encryptAndPackage = async (vaultContent: VaultContent, password: string): Promise<{encryptedBlob: Blob, keyJsonString: string}> => {
  // This is a mock implementation. In a real app, this would involve actual cryptography.
  console.log('Mock encrypting vault with password:', password ? '******' : '(empty)');
  
  const contentString = JSON.stringify(vaultContent, null, 2);
  const keyData = {
    salt: 'mock-salt-a1b2c3d4',
    iv: 'mock-iv-e5f6g7h8',
    passwordHint: `Starts with '${password.slice(0, 1)}', ends with '${password.slice(-1)}'`,
  };
  
  const encryptedBlob = new Blob([`--- MOCK ENCRYPTED DATA ---\n${contentString}`], { type: 'application/octet-stream' });
  const keyJsonString = JSON.stringify(keyData, null, 2);

  // Simulate an async encryption process
  await new Promise(resolve => setTimeout(resolve, 1500));

  return { encryptedBlob, keyJsonString };
};

export const decryptAndUnpackage = async (
  encryptedBlob: Blob,
  keyJsonString: string,
  password: string
): Promise<VaultContent> => {
  // This is a mock implementation.
  console.log('Mock decrypting vault with password:', password ? '******' : '(empty)');

  // Simulate reading and parsing files
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const keyData = JSON.parse(keyJsonString);
  const encryptedText = await encryptedBlob.text();

  // "Validate" password using the hint
  const passwordHint = `Starts with '${password.slice(0, 1)}', ends with '${password.slice(-1)}'`;
  if (!password || keyData.passwordHint !== passwordHint) {
      throw new Error("Invalid password or corrupt key file.");
  }
  
  // "Decrypt" the content
  if (!encryptedText.startsWith('--- MOCK ENCRYPTED DATA ---\n')) {
      throw new Error("Invalid or corrupt vault file.");
  }

  const contentString = encryptedText.replace('--- MOCK ENCRYPTED DATA ---\n', '');
  
  // Simulate an async decryption process
  await new Promise(resolve => setTimeout(resolve, 1500));

  return JSON.parse(contentString) as VaultContent;
};
