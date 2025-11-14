import type { VaultContent } from '../types';

// This service handles all client-side cryptographic operations.
const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12;

// --- PBKDF2 parameters for password-based key derivation ---
const PBKDF2_ITERATIONS = 250000;
const PBKDF2_SALT_LENGTH_BYTES = 16;
const PBKDF2_ALGO = 'PBKDF2';
const PBKDF2_HASH = 'SHA-256';

// Helper to convert ArrayBuffer to Base64 string
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

// Helper to convert Base64 string to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Derives a key from a password using PBKDF2.
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordBuffer = new TextEncoder().encode(password);
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: PBKDF2_ALGO },
        false,
        ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: PBKDF2_ALGO,
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH,
        },
        baseKey,
        { name: ALGO, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
    );
}


/**
 * Encrypts a data object and generates a new cryptographic key, protected by a password.
 */
export async function encryptAndPackage(data: VaultContent, password: string): Promise<{ encryptedBlob: Blob; keyJsonString: string }> {
  // 1. Generate the main key for encrypting the vault content
  const contentKey = await window.crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  const contentKeyJwk = await window.crypto.subtle.exportKey('jwk', contentKey);
  const contentKeyString = JSON.stringify(contentKeyJwk);

  // 2. Derive a key from the user's password to encrypt the main key
  const salt = window.crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_LENGTH_BYTES));
  const passwordDerivedKey = await deriveKeyFromPassword(password, salt);

  // 3. Encrypt the main key using the password-derived key
  const keyEncryptionIv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encryptedContentKey = await window.crypto.subtle.encrypt(
    { name: ALGO, iv: keyEncryptionIv },
    passwordDerivedKey,
    new TextEncoder().encode(contentKeyString)
  );

  // 4. Create the downloadable key file content
  const keyObject = {
    '//': '--- SECURE VAULT KEY (Password Protected) ---',
    '// ': 'DO NOT SHARE OR LOSE THIS FILE. It is required to decrypt your vault along with your password.',
    salt: bufferToBase64(salt),
    iv: bufferToBase64(keyEncryptionIv),
    encryptedKey: bufferToBase64(encryptedContentKey),
    '//  ': `Key Derivation: ${PBKDF2_ALGO}-${PBKDF2_HASH}, ${PBKDF2_ITERATIONS} iterations`,
    '//   ': `Encryption: ${ALGO}-${KEY_LENGTH}`,
    '//    ': '--- END OF KEY ---',
  };
  const keyJsonString = JSON.stringify(keyObject, null, 2);

  // 5. Encrypt the actual vault data (note and files) with the main key
  const dataIv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const dataString = JSON.stringify(data);
  const encodedData = new TextEncoder().encode(dataString);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: ALGO, iv: dataIv },
    contentKey,
    encodedData
  );

  const encryptedBlob = new Blob([dataIv, new Uint8Array(encryptedContent)], { type: 'application/octet-stream' });
  return { encryptedBlob, keyJsonString };
}

/**
 * Decrypts an encrypted vault file using a password-protected key file.
 */
export async function unpackageAndDecrypt(encryptedFile: File, keyFile: File, password: string): Promise<VaultContent> {
  // 1. Read the key file and extract parameters
  const keyFileContent = await keyFile.text();
  const keyData = JSON.parse(keyFileContent);
  
  if (!keyData.salt || !keyData.iv || !keyData.encryptedKey) {
      throw new Error('Invalid key file format. Missing salt, iv, or encryptedKey.');
  }

  const salt = base64ToUint8Array(keyData.salt);
  const keyEncryptionIv = base64ToUint8Array(keyData.iv);
  const encryptedContentKey = base64ToUint8Array(keyData.encryptedKey);

  // 2. Re-derive the key from the password to decrypt the main key
  const passwordDerivedKey = await deriveKeyFromPassword(password, salt);

  // 3. Decrypt the main key
  let decryptedContentKeyBuffer: ArrayBuffer;
  try {
     decryptedContentKeyBuffer = await window.crypto.subtle.decrypt(
        { name: ALGO, iv: keyEncryptionIv },
        passwordDerivedKey,
        encryptedContentKey
    );
  } catch (e) {
      throw new Error("Failed to decrypt the key. The password is likely incorrect.");
  }

  const decryptedContentKeyString = new TextDecoder().decode(decryptedContentKeyBuffer);
  const contentKeyJwk = JSON.parse(decryptedContentKeyString);

  const contentKey = await window.crypto.subtle.importKey(
    'jwk',
    contentKeyJwk,
    { name: ALGO },
    true,
    ['decrypt']
  );

  // 4. Decrypt the actual vault data with the decrypted main key
  const encryptedBuffer = await encryptedFile.arrayBuffer();
  if (encryptedBuffer.byteLength <= IV_LENGTH_BYTES) {
      throw new Error('Invalid encrypted file: too short.');
  }

  const dataIv = new Uint8Array(encryptedBuffer.slice(0, IV_LENGTH_BYTES));
  const encryptedContent = new Uint8Array(encryptedBuffer.slice(IV_LENGTH_BYTES));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: ALGO, iv: dataIv },
    contentKey,
    encryptedContent
  );

  const decryptedString = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedString);
}
