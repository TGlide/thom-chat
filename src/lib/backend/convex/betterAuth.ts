import { action, internalQuery, internalMutation, query as convexQuery } from './_generated/server';
import { internal } from './_generated/api';
import { ConvexHandler, type ConvexReturnType } from '@better-auth-kit/convex/handler';
import { v } from 'convex/values';

const { betterAuth, query, insert, update, delete_, count, getSession } = ConvexHandler({
	action,
	internalQuery,
	internalMutation,
	internal,
}) as ConvexReturnType;

export { betterAuth, query, insert, update, delete_, count, getSession };

export type SessionObj = {
	_creationTime: number;
	_id: string;
	expiresAt: string;
	ipAddress: string;
	token: string;
	updatedAt: string;
	userAgent: string;
	userId: string;
};

export const publicGetSession = convexQuery({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const s = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		// Without this if, typescript goes bonkers
		if (!s) {
			return false;
		}

		// this is also needed. I don't know why :(
		const ret = s as SessionObj;
		return ret;
	},
});
