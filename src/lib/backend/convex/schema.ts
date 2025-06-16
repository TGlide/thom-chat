import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Provider } from '../../../lib/types';

export const providerValidator = v.union(...Object.values(Provider).map((p) => v.literal(p)));

export default defineSchema({
	user_keys: defineTable({
		user_id: v.string(),
		provider: providerValidator,
		key: v.string(),
	})
		.index('by_user', ['user_id'])
		.index('by_provider_user', ['provider', 'user_id']),
	user_enabled_models: defineTable({
		user_id: v.string(),
		provider: providerValidator,
		/** Different providers may use different ids for the same model */
		model_id: v.string(),
		pinned: v.union(v.number(), v.null()),
	})
		.index('by_user', ['user_id'])
		.index('by_model_provider', ['model_id', 'provider'])
		.index('by_provider_user', ['provider', 'user_id'])
		.index('by_model_provider_user', ['model_id', 'provider', 'user_id']),
	conversations: defineTable({
		user_id: v.string(),
		title: v.string(),
		created_at: v.number(),
		updated_at: v.number(),
	})
		.index('by_user', ['user_id'])
		.index('by_user_updated', ['user_id', 'updated_at']),
	messages: defineTable({
		conversation_id: v.id('conversations'),
		role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
		content: v.string(),
		created_at: v.number(),
		model_id: v.optional(v.string()),
		provider: v.optional(providerValidator),
		token_count: v.optional(v.number()),
	})
		.index('by_conversation', ['conversation_id'])
		.index('by_conversation_created', ['conversation_id', 'created_at']),
});
