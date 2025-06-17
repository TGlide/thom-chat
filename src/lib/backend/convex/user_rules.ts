import { v } from 'convex/values';
import { query } from './_generated/server';
import { mutation } from './functions';
import { internal } from './_generated/api';
import { ruleAttachValidator } from './schema';
import { type Doc } from './_generated/dataModel';

export const create = mutation({
	args: {
		name: v.string(),
		attach: ruleAttachValidator,
		rule: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
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

export const update = mutation({
	args: {
		ruleId: v.id('user_rules'),
		attach: ruleAttachValidator,
		rule: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) throw new Error('Invalid session token');

		const existing = await ctx.db.get(args.ruleId);

		if (!existing) throw new Error('Rule not found');
		if (existing.user_id !== session.userId) throw new Error('You are not the owner of this rule');

		await ctx.db.patch(args.ruleId, {
			attach: args.attach,
			rule: args.rule,
		});
	},
});

export const remove = mutation({
	args: {
		ruleId: v.id('user_rules'),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) throw new Error('Invalid session token');

		const existing = await ctx.db.get(args.ruleId);

		if (!existing) throw new Error('Rule not found');
		if (existing.user_id !== session.userId) throw new Error('You are not the owner of this rule');

		await ctx.db.delete(args.ruleId);
	},
});

export const all = query({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args): Promise<Doc<'user_rules'>[]> => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) throw new Error('Invalid session token');

		const allRules = await ctx.db
			.query('user_rules')
			.withIndex('by_user', (q) => q.eq('user_id', session.userId))
			.collect();

		return allRules;
	},
});
