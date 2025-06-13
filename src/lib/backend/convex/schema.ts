import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	user_keys: defineTable({
		openRouter: v.string()
	})
});