import { CryptoService } from './encrypt';
import { describe, it, expect } from 'vitest';

const ENCRYPTION_SECRET = 'supersecretkey';

describe('CryptoService', () => {
	it('should encrypt and decrypt a string', () => {
		const crypto = new CryptoService(ENCRYPTION_SECRET);
		const encrypted = crypto.encrypt('test');
		const decrypted = crypto.decrypt(encrypted);
		expect(decrypted._unsafeUnwrap()).toBe('test');
	});
});