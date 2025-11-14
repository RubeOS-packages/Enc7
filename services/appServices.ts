import type { VaultContent } from '../types';

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