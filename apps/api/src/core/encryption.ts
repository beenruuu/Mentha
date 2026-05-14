import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT = 'mentha-aeo-key-encryption';

function deriveKey(): Buffer {
    return scryptSync(env.BETTER_AUTH_SECRET, SALT, KEY_LENGTH);
}

export function encryptApiKey(plaintext: string): string {
    const key = deriveKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptApiKey(encryptedData: string): string {
    const key = deriveKey();
    const parts = encryptedData.split(':');
    if (parts.length < 3) throw new Error('Invalid encrypted key format');

    const iv = Buffer.from(parts[0]!, 'hex');
    const authTag = Buffer.from(parts[1]!, 'hex');
    const encrypted = parts.slice(2).join(':');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
