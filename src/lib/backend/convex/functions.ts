import {
	// eslint-disable-next-line no-restricted-imports
	internalMutation as rawInternalMutation,
	// eslint-disable-next-line no-restricted-imports
	mutation as rawMutation,
} from './_generated/server';

import { customCtx, customMutation } from 'convex-helpers/server/customFunctions';
import { Triggers } from 'convex-helpers/server/triggers';
import { type Id, type DataModel } from './_generated/dataModel';

const triggers = new Triggers<DataModel>();

// Cascade delete messages when a conversation is deleted
triggers.register('conversations', async (ctx, change) => {
	if (change.operation === 'delete') {
		const query = ctx.db
			.query('messages')
			.withIndex('by_conversation', (q) => q.eq('conversation_id', change.id));

		for await (const message of query) {
			await ctx.db.delete(message._id);
		}
	}
});

// Update conversation updated_at when a message is created/updated
triggers.register('messages', async (ctx, change) => {
	if (change.operation === 'insert' || change.operation === 'update') {
		const conversationId = change.newDoc.conversation_id;
		const conversation = await ctx.db.get(conversationId as Id<'conversations'>);

		if (!conversation) return;

		await ctx.db.patch(conversationId as Id<'conversations'>, {
			updated_at: Date.now(),
		});
	}
});

// TODO: Cascade delete rules when a user is deleted

// create wrappers that replace the built-in `mutation` and `internalMutation`
// the wrappers override `ctx` so that `ctx.db.insert`, `ctx.db.patch`, etc. run registered trigger functions
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(rawInternalMutation, customCtx(triggers.wrapDB));
