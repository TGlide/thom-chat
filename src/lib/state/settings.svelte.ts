import { createPersistedObj } from '$lib/spells/persisted-obj.svelte';

export const settings = createPersistedObj('settings', {
	modelId: undefined as string | undefined,
	webSearchEnabled: false,
	reasoningEffort: 'low' as 'low' | 'medium' | 'high',
});
