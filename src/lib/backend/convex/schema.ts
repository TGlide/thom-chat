import { defineSchema, defineTable } from 'convex/server';
import { type Infer, v } from 'convex/values';
import { Provider } from '../../../lib/types';

export const providerValidator = v.union(...Object.values(Provider).map((p) => v.literal(p)));
export const messageRoleValidator = v.union(
	v.literal('user'),
	v.literal('assistant'),
	v.literal('system')
);

export type MessageRole = Infer<typeof messageRoleValidator>;

export const ruleAttachValidator = v.union(v.literal('always'), v.literal('manual'));

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
	user_rules: defineTable({
		user_id: v.string(),
		name: v.string(),
		attach: ruleAttachValidator,
		rule: v.string(),
	})
		.index('by_user', ['user_id'])
		.index('by_user_attach', ['user_id', 'attach'])
		.index('by_user_name', ['user_id', 'name']),
	conversations: defineTable({
		user_id: v.string(),
		title: v.string(),
		updated_at: v.optional(v.number()),
	}).index('by_user', ['user_id']),
	messages: defineTable({
		conversation_id: v.string(),
		role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
		content: v.string(),
		// Optional, coming from SK API route
		model_id: v.optional(v.string()),
		provider: v.optional(providerValidator),
		token_count: v.optional(v.number()),
	}).index('by_conversation', ['conversation_id']),
});
