import { v } from 'convex/values';
import { api } from './_generated/api';
import { mutation, query } from './_generated/server';

export const generateUploadUrl = mutation({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		return await ctx.storage.generateUploadUrl();
	},
});

export const getUrl = query({
	args: {
		storage_id: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		return await ctx.storage.getUrl(args.storage_id);
	},
});

export const deleteFile = mutation({
	args: {
		storage_id: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		await ctx.storage.delete(args.storage_id);
	},
});