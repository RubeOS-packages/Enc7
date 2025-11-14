export type Page = 'home' | 'encrypt' | 'decrypt';

export interface VaultFile {
  name: string;
  type: string;
  data: string; // base64 data URL
}

export interface VaultContent {
  note: string;
  files: VaultFile[];
}
