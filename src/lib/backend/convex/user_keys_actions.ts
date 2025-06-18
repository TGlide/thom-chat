'use node';

import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { action } from './_generated/server';
import { providerValidator } from './schema';
import { CryptoService } from '../../utils/encrypt';

const crypto = new CryptoService();

export const set = action({
	args: {
		provider: providerValidator,
		key: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const encryptedKey = crypto.encrypt(args.key);

		console.log('encryptedKey', encryptedKey);

		await ctx.runMutation(api.user_keys.set, {
			provider: args.provider,
			key: encryptedKey,
			session_token: args.session_token,
		});
	},
});
