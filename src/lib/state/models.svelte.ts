import { page } from '$app/state';
import { api } from '$lib/backend/convex/_generated/api';
import { getModelKey } from '$lib/backend/convex/user_enabled_models';
import type { ProviderModelMap } from '$lib/backend/models/all';
import { useCachedQuery } from '$lib/cache/cached-query.svelte';
import { createInit } from '$lib/spells/create-init.svelte';
import { Provider } from '$lib/types';
import { watch } from 'runed';
import { session } from './session.svelte';

export class Models {
	enabled = $state({} as Record<string, unknown>);

	init = createInit(() => {
		const query = useCachedQuery(api.user_enabled_models.get_enabled, {
			session_token: session.current?.session.token ?? '',
		});
		watch(
			() => $state.snapshot(query.data),
			(data) => {
				if (data) this.enabled = data;
			}
		);
	});

	from<P extends Provider>(provider: Provider) {
		return page.data.models[provider].map((m: { id: string }) => {
			return {
				...m,
				enabled: this.enabled[getModelKey({ provider, model_id: m.id })] !== undefined,
			};
		}) as Array<ProviderModelMap[P] & { enabled: boolean }>;
	}
}

export const models = new Models();
