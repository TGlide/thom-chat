import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { Provider } from '../../../lib/types';

export const providerValidator = v.union(...Object.values(Provider).map((p) => v.literal(p)));

export default defineSchema({
	user_keys: defineTable({
		provider: providerValidator,
		user_id: v.string(),
		key: v.string(),
	})
		.index('by_user', ['user_id'])
		.index('by_provider_user', ['provider', 'user_id']),
});
