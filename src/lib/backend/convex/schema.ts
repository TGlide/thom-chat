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
	user_settings: defineTable({
		user_id: v.string(),
		privacy_mode: v.boolean(),
		free_messages_used: v.optional(v.number()),
	}).index('by_user', ['user_id']),
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
		// null is just here for compat we treat null as true
		pinned: v.optional(v.union(v.boolean(), v.null())),
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
		pinned: v.optional(v.boolean()),
		generating: v.optional(v.boolean()),
		cost_usd: v.optional(v.number()),
		public: v.optional(v.boolean()),
		branched_from: v.optional(v.id('conversations')),
	}).index('by_user', ['user_id']),
	messages: defineTable({
		conversation_id: v.string(),
		role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
		content: v.string(),
		content_html: v.optional(v.string()),
		reasoning: v.optional(v.string()),
		error: v.optional(v.string()),
		// Optional, coming from SK API route
		model_id: v.optional(v.string()),
		provider: v.optional(providerValidator),
		token_count: v.optional(v.number()),
		// Optional image attachments
		images: v.optional(
			v.array(
				v.object({
					url: v.string(),
					storage_id: v.string(),
					fileName: v.optional(v.string()),
				})
			)
		),
		cost_usd: v.optional(v.number()),
		generation_id: v.optional(v.string()),
		web_search_enabled: v.optional(v.boolean()),
	}).index('by_conversation', ['conversation_id']),
});
