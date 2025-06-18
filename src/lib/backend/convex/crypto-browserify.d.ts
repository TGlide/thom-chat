declare module 'crypto-browserify' {
	import { RandomBytes, PseudoRandomBytes } from 'randombytes';
	import { Hash as CreateHash } from 'create-hash';
	import { Hmac as CreateHmac } from 'create-hmac';
	import { PBKDF2, PBKDF2Sync } from 'pbkdf2';
	import {
		Cipher,
		CreateCipher,
		Cipheriv,
		CreateCipheriv,
		Decipher,
		CreateDecipher,
		Decipheriv,
		CreateDecipheriv,
		GetCiphers,
		ListCiphers,
	} from 'browserify-cipher';
	import {
		DiffieHellmanGroup,
		CreateDiffieHellmanGroup,
		GetDiffieHellman,
		CreateDiffieHellman,
		DiffieHellman,
	} from 'diffie-hellman';
	import { CreateSign, Sign, CreateVerify, Verify } from 'browserify-sign';
	import { CreateECDH } from 'create-ecdh';
	import { PublicEncrypt, PrivateEncrypt, PublicDecrypt, PrivateDecrypt } from 'public-encrypt';
	import { RandomFill, RandomFillSync } from 'randomfill';

	export const randomBytes: RandomBytes;
	export const rng: RandomBytes;
	export const pseudoRandomBytes: PseudoRandomBytes;
	export const prng: PseudoRandomBytes;

	export const createHash: CreateHash;
	export const Hash: CreateHash;

	export const createHmac: CreateHmac;
	export const Hmac: CreateHmac;

	export function getHashes(): string[];

	export const pbkdf2: PBKDF2;
	export const pbkdf2Sync: PBKDF2Sync;

	export const Cipher: typeof Cipher;
	export const createCipher: CreateCipher;
	export const Cipheriv: typeof Cipheriv;
	export const createCipheriv: CreateCipheriv;
	export const Decipher: typeof Decipher;
	export const createDecipher: CreateDecipher;
	export const Decipheriv: typeof Decipheriv;
	export const createDecipheriv: CreateDecipheriv;
	export const getCiphers: GetCiphers;
	export const listCiphers: ListCiphers;

	export const DiffieHellmanGroup: typeof DiffieHellmanGroup;
	export const createDiffieHellmanGroup: CreateDiffieHellmanGroup;
	export const getDiffieHellman: GetDiffieHellman;
	export const createDiffieHellman: CreateDiffieHellman;
	export const DiffieHellman: typeof DiffieHellman;

	export const createSign: CreateSign;
	export const Sign: typeof Sign;
	export const createVerify: CreateVerify;
	export const Verify: typeof Verify;

	export const createECDH: CreateECDH;

	export const publicEncrypt: PublicEncrypt;
	export const privateEncrypt: PrivateEncrypt;
	export const publicDecrypt: PublicDecrypt;
	export const privateDecrypt: PrivateDecrypt;

	export const randomFill: RandomFill;
	export const randomFillSync: RandomFillSync;

	export function createCredentials(): never;

	export const constants: {
		readonly DH_CHECK_P_NOT_SAFE_PRIME: 2;
		readonly DH_CHECK_P_NOT_PRIME: 1;
		readonly DH_UNABLE_TO_CHECK_GENERATOR: 4;
		readonly DH_NOT_SUITABLE_GENERATOR: 8;
		readonly NPN_ENABLED: 1;
		readonly ALPN_ENABLED: 1;
		readonly RSA_PKCS1_PADDING: 1;
		readonly RSA_SSLV23_PADDING: 2;
		readonly RSA_NO_PADDING: 3;
		readonly RSA_PKCS1_OAEP_PADDING: 4;
		readonly RSA_X931_PADDING: 5;
		readonly RSA_PKCS1_PSS_PADDING: 6;
		readonly POINT_CONVERSION_COMPRESSED: 2;
		readonly POINT_CONVERSION_UNCOMPRESSED: 4;
		readonly POINT_CONVERSION_HYBRID: 6;
	};
}
