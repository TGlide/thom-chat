<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { cn } from '$lib/utils/utils';
	import { Command, Popover } from 'bits-ui';
	import { Button } from '$lib/components/ui/button';
	import ChevronDownIcon from '~icons/lucide/chevron-down';
	import CheckIcon from '~icons/lucide/check';

	// Company icons from simple-icons
	import OpenaiIcon from '~icons/simple-icons/openai';
	import GoogleIcon from '~icons/simple-icons/google';
	import MetaIcon from '~icons/simple-icons/meta';
	import MicrosoftIcon from '~icons/simple-icons/microsoft';
	import XIcon from '~icons/simple-icons/x';

	// Fallback to lucide icons for companies without simple-icons
	import BrainIcon from '~icons/lucide/brain';
	import ZapIcon from '~icons/lucide/zap';
	import CpuIcon from '~icons/lucide/cpu';
	import RobotIcon from '~icons/lucide/bot';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();

	const enabledModelsQuery = useCachedQuery(api.user_enabled_models.get_enabled, {
		session_token: session.current?.session.token ?? '',
	});

	const enabledArr = $derived(Object.values(enabledModelsQuery.data ?? {}));

	// Company icon mapping
	const companyIcons: Record<string, typeof OpenaiIcon> = {
		openai: OpenaiIcon,
		anthropic: BrainIcon,
		google: GoogleIcon,
		meta: MetaIcon,
		mistral: ZapIcon,
		'x-ai': XIcon,
		microsoft: MicrosoftIcon,
		qwen: CpuIcon,
		deepseek: RobotIcon,
		cohere: CpuIcon,
	};

	// Function to extract company from model ID
	function getCompanyFromModelId(modelId: string): string {
		const id = modelId.toLowerCase();

		// OpenAI models
		if (id.includes('gpt') || id.includes('o1') || id.includes('openai')) return 'openai';

		// Anthropic models
		if (id.includes('claude') || id.includes('anthropic')) return 'anthropic';

		// Google models
		if (
			id.includes('gemini') ||
			id.includes('gemma') ||
			id.includes('google') ||
			id.includes('palm')
		)
			return 'google';

		// Meta models
		if (id.includes('llama') || id.includes('meta')) return 'meta';

		// Mistral models
		if (id.includes('mistral') || id.includes('mixtral')) return 'mistral';

		// xAI models
		if (id.includes('grok') || id.includes('x-ai')) return 'x-ai';

		// Microsoft models
		if (id.includes('phi') || id.includes('microsoft')) return 'microsoft';

		// Qwen models
		if (id.includes('qwen') || id.includes('alibaba')) return 'qwen';

		// DeepSeek models
		if (id.includes('deepseek')) return 'deepseek';

		// Cohere models
		if (id.includes('command') || id.includes('cohere')) return 'cohere';

		// Try to extract from model path (e.g., "anthropic/claude-3")
		const pathParts = modelId.split('/');
		if (pathParts.length > 1) {
			const provider = pathParts[0]?.toLowerCase();
			if (provider && companyIcons[provider]) return provider;
		}

		return 'other';
	}

	// Group models by company
	const groupedModels = $derived.by(() => {
		console.log('📊 enabledArr:', enabledArr);
		const groups: Record<string, typeof enabledArr> = {};

		enabledArr.forEach((model) => {
			const company = getCompanyFromModelId(model.model_id);
			console.log(`🏢 Model ${model.model_id} -> Company: ${company}`);
			if (!groups[company]) {
				groups[company] = [];
			}
			groups[company].push(model);
		});

		console.log('📋 Groups:', groups);

		// Sort companies with known icons first
		const result = Object.entries(groups).sort(([a], [b]) => {
			const aHasIcon = companyIcons[a] ? 0 : 1;
			const bHasIcon = companyIcons[b] ? 0 : 1;
			return aHasIcon - bHasIcon || a.localeCompare(b);
		});

		console.log('🎯 Final grouped models:', result);
		return result;
	});

	let open = $state(false);

	// Find current model details
	const currentModel = $derived(enabledArr.find((m) => m.model_id === settings.modelId));
	const currentCompany = $derived(
		currentModel ? getCompanyFromModelId(currentModel.model_id) : 'other'
	);

	$effect(() => {
		if (!enabledArr.find((m) => m.model_id === settings.modelId) && enabledArr.length > 0) {
			settings.modelId = enabledArr[0]!.model_id;
		}
	});

	function selectModel(modelId: string) {
		settings.modelId = modelId;
		open = false;
	}
</script>

{#if enabledArr.length === 0}
	<!-- Fallback to original select if no models are loaded -->
	<select bind:value={settings.modelId} class={cn('border-border border', className)}>
		<option value="">Loading models...</option>
	</select>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger
			class={cn('flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className)}
			aria-expanded={open}
		>
			<div class="flex items-center gap-2">
				{#if companyIcons[currentCompany]}
					{@const IconComponent = companyIcons[currentCompany]}
					<IconComponent class="size-4" />
				{/if}
				<span class="truncate">
					{currentModel?.model_id.replace(/^[^/]+\//, '') || 'Select model'}
				</span>
			</div>
			<ChevronDownIcon class="size-4 opacity-50" />
		</Popover.Trigger>

		<Popover.Content
			class="z-50 mt-1 max-h-96 w-full min-w-80 overflow-hidden rounded-md border bg-white/95 p-0 shadow-lg backdrop-blur-sm dark:bg-gray-950/95"
		>
			<Command.Root columns={3}>
				<Command.Input
					class="flex h-10 w-full rounded-md border-0 border-b bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
					placeholder="Search models..."
				/>
				<Command.List>
					<Command.Viewport>
						<Command.Empty>
							No models available. Enable some models in the account settings.
						</Command.Empty>
						{#each groupedModels as [company, models]}
							<Command.Group class="space-y-2">
								<Command.GroupHeading
									class="text-muted-foreground flex items-center gap-2 border-b border-gray-200 pb-1 pt-3 px-3 text-xs font-semibold tracking-wide uppercase dark:border-gray-700"
								>
									{#if companyIcons[company]}
										{@const IconComponent = companyIcons[company]}
										<IconComponent class="size-4" />
									{/if}
									{company} ({models.length})
								</Command.GroupHeading>
								<Command.GroupItems class="grid grid-cols-3 gap-2 px-3 pb-3">
									{#each models as model (model._id)}
										<Command.Item
											value={model.model_id}
											onSelect={() => selectModel(model.model_id)}
											class={cn(
												'data-selected:bg-accent data-selected:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors',
												settings.modelId === model.model_id && 'bg-primary text-primary-foreground'
											)}
										>
											<div class="flex flex-1 items-center justify-between gap-2">
												<span class="truncate text-left font-medium">
													{model.model_id.replace(/^[^/]+\//, '')}
												</span>
												{#if settings.modelId === model.model_id}
													<CheckIcon class="size-4 shrink-0" />
												{/if}
											</div>
										</Command.Item>
									{/each}
								</Command.GroupItems>
							</Command.Group>
						{/each}
					</Command.Viewport>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/if}
