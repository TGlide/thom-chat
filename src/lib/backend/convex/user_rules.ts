import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { ruleAttachValidator } from './schema';
import { Doc } from './_generated/dataModel';

export const create = mutation({
	args: {
		name: v.string(),
		attach: ruleAttachValidator,
		rule: v.string(),
		sessionToken: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.sessionToken,
		});

		if (!session) throw new Error('Invalid session token');

		const existing = await ctx.db
			.query('user_rules')
			.withIndex('by_user_name', (q) => q.eq('user_id', session.userId).eq('name', args.name))
			.first();

		if (existing) throw new Error('Rule with this name already exists');

		await ctx.db.insert('user_rules', {
			user_id: session.userId,
			name: args.name,
			attach: args.attach,
			rule: args.rule,
		});
	},
});

export const all = query({
	args: {
		sessionToken: v.string(),
	},
	handler: async (ctx, args): Promise<Doc<'user_rules'>[]> => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.sessionToken,
		});

		if (!session) throw new Error('Invalid session token');

		const allRules = await ctx.db
			.query('user_rules')
			.withIndex('by_user', (q) => q.eq('user_id', session.userId))
			.collect();

		return allRules;
	},
});
