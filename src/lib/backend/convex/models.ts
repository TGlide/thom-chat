import { query } from './_generated/server';
import { v } from 'convex/values';
import { getOpenRouterModels } from '../models/open-router';

export const get_enabled_with_details = query({
	args: {
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		const enabledModels = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_user', (q) => q.eq('user_id', args.user_id))
			.collect();

		// Get OpenRouter models for details
		const openRouterModelsResult = await getOpenRouterModels();
		const openRouterModels = openRouterModelsResult.unwrapOr([]);

		const result: Record<string, { name: string; description?: string; provider: string }> = {};

		for (const enabledModel of enabledModels) {
			const key = `${enabledModel.provider}:${enabledModel.model_id}`;
			
			if (enabledModel.provider === 'openrouter') {
				const modelDetails = openRouterModels.find(m => m.id === enabledModel.model_id);
				if (modelDetails) {
					result[key] = {
						name: modelDetails.name,
						description: modelDetails.description,
						provider: enabledModel.provider,
					};
				}
			} else {
				// For other providers, use model_id as fallback
				result[key] = {
					name: enabledModel.model_id,
					provider: enabledModel.provider,
				};
			}
		}

		return result;
	},
});