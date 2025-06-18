import { err, ok, Result } from 'neverthrow';
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 12 or 16 bytes
const KEY_LENGTH = 32; // 256 bits

export class CryptoService {
	private secretKey: Buffer;

	constructor(encryptionKey?: string) {
		const secretKeyString = encryptionKey ?? process.env.API_KEY_ENCRYPTION_SECRET;

		if (!secretKeyString) {
			throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is required');
		}

		// Derive a consistent key from the environment variable
		this.secretKey = crypto.scryptSync(secretKeyString, 'salt', KEY_LENGTH);
	}

	encrypt(secret: string): string {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, this.secretKey, iv);
		cipher.setAAD(Buffer.from('api-key-encryption')); // Additional authenticated data

		let encrypted = cipher.update(secret, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		const tag = cipher.getAuthTag();

		// Combine IV, tag, and encrypted data
		const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;

		return combined;
	}

	decrypt(encryptedText: string): Result<string, string> {
		try {
			const parts = encryptedText.split(':');

			if (parts.length !== 3) {
				throw new Error('Invalid encrypted data format');
			}

			const iv = Buffer.from(parts[0] ?? '', 'hex');
			const tag = Buffer.from(parts[1] ?? '', 'hex');
			const encrypted = parts[2] ?? '';

			const decipher = crypto.createDecipheriv(ALGORITHM, this.secretKey, iv);
			decipher.setAAD(Buffer.from('api-key-encryption'));
			decipher.setAuthTag(tag);

			let decrypted = decipher.update(encrypted, 'hex', 'utf8');
			decrypted += decipher.final('utf8');

			return ok(decrypted);
		} catch {
			return err('Invalid encrypted data format');
		}
	}
}
