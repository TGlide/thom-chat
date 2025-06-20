<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import Cohere from '$lib/components/icons/cohere.svelte';
	import Deepseek from '$lib/components/icons/deepseek.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { models as modelsState } from '$lib/state/models.svelte';
	import { session } from '$lib/state/session.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { Provider } from '$lib/types';
	import { fuzzysearch } from '$lib/utils/fuzzy-search';
	import { supportsImages } from '$lib/utils/model-capabilities';
	import { capitalize } from '$lib/utils/strings';
	import { cn } from '$lib/utils/utils';
	import { mergeAttrs } from 'melt';
	import { type Component } from 'svelte';
	import { type HTMLAttributes } from 'svelte/elements';
	import LogosClaudeIcon from '~icons/logos/claude-icon';
	import LogosMistralAiIcon from '~icons/logos/mistral-ai-icon';
	import BrainIcon from '~icons/lucide/brain';
	import ChevronDownIcon from '~icons/lucide/chevron-down';
	import CpuIcon from '~icons/lucide/cpu';
	import EyeIcon from '~icons/lucide/eye';
	import SearchIcon from '~icons/lucide/search';
	import ZapIcon from '~icons/lucide/zap';
	import MaterialIconThemeGeminiAi from '~icons/material-icon-theme/gemini-ai';
	import GoogleIcon from '~icons/simple-icons/google';
	import MetaIcon from '~icons/simple-icons/meta';
	import MicrosoftIcon from '~icons/simple-icons/microsoft';
	import OpenaiIcon from '~icons/simple-icons/openai';
	import XIcon from '~icons/simple-icons/x';
	import { Popover, Command } from 'bits-ui';
	import { shortcut } from '$lib/actions/shortcut.svelte';

	type Props = {
		class?: string;
		/* When images are attached, we should not select models that don't support images */
		onlyImageModels?: boolean;
	};

	let { class: className, onlyImageModels }: Props = $props();

	const enabledModelsQuery = useCachedQuery(api.user_enabled_models.get_enabled, {
		session_token: session.current?.session.token ?? '',
	});

	const enabledArr = $derived(Object.values(enabledModelsQuery.data ?? {}));

	modelsState.init();

	// Company icon mapping
	const companyIcons: Record<string, Component> = {
		openai: OpenaiIcon,
		anthropic: BrainIcon,
		google: GoogleIcon,
		meta: MetaIcon,
		mistral: ZapIcon,
		'x-ai': XIcon,
		microsoft: MicrosoftIcon,
		qwen: CpuIcon,
		deepseek: Deepseek,
		cohere: Cohere,
	};

	function getModelIcon(modelId: string): Component | null {
		const id = modelId.toLowerCase();

		// Model-specific icons take priority
		if (id.includes('claude') || id.includes('anthropic')) return LogosClaudeIcon;
		if (id.includes('gemini') || id.includes('gemma')) return MaterialIconThemeGeminiAi;
		if (id.includes('mistral') || id.includes('mixtral')) return LogosMistralAiIcon;

		// Fallback to company icons
		const company = getCompanyFromModelId(modelId);
		return companyIcons[company] || null;
	}

	function getCompanyFromModelId(modelId: string): string {
		const id = modelId.toLowerCase();

		if (id.includes('gpt') || id.includes('o1') || id.includes('openai')) return 'openai';

		if (id.includes('claude') || id.includes('anthropic')) return 'anthropic';

		if (
			id.includes('gemini') ||
			id.includes('gemma') ||
			id.includes('google') ||
			id.includes('palm')
		)
			return 'google';

		if (id.includes('llama') || id.includes('meta')) return 'meta';

		if (id.includes('mistral') || id.includes('mixtral')) return 'mistral';

		if (id.includes('grok') || id.includes('x-ai')) return 'x-ai';

		if (id.includes('phi') || id.includes('microsoft')) return 'microsoft';

		if (id.includes('qwen') || id.includes('alibaba')) return 'qwen';

		if (id.includes('deepseek')) return 'deepseek';

		if (id.includes('command') || id.includes('cohere')) return 'cohere';

		// Try to extract from model path (e.g., "anthropic/claude-3")
		const pathParts = modelId.split('/');
		if (pathParts.length > 1) {
			const provider = pathParts[0]?.toLowerCase();
			if (provider && companyIcons[provider]) return provider;
		}

		return 'other';
	}

	let search = $state('');

	const filteredModels = $derived(
		fuzzysearch({
			haystack: enabledArr,
			needle: search,
			property: 'model_id',
		})
	);

	// Group models by company
	const groupedModels = $derived.by(() => {
		const groups: Record<string, typeof filteredModels> = {};

		filteredModels.forEach((model) => {
			const company = getCompanyFromModelId(model.model_id);
			if (!groups[company]) {
				groups[company] = [];
			}
			groups[company].push(model);
		});

		// Sort companies with known icons first
		const result = Object.entries(groups).sort(([a], [b]) => {
			const aHasIcon = companyIcons[a] ? 0 : 1;
			const bHasIcon = companyIcons[b] ? 0 : 1;
			return aHasIcon - bHasIcon || a.localeCompare(b);
		});

		return result;
	});

	const currentModel = $derived(enabledArr.find((m) => m.model_id === settings.modelId));

	$effect(() => {
		if (!enabledArr.find((m) => m.model_id === settings.modelId) && enabledArr.length > 0) {
			settings.modelId = enabledArr[0]!.model_id;
		}
	});

	let open = $state(false);

	// Model name formatting utility
	const termReplacements = [
		{ from: 'gpt', to: 'GPT' },
		{ from: 'claude', to: 'Claude' },
		{ from: 'deepseek', to: 'DeepSeek' },
		{ from: 'o3', to: 'o3' },
	];

	function formatModelName(modelId: string) {
		const cleanId = modelId.replace(/^[^/]+\//, '');
		const parts = cleanId.split(/[-_,:]/);

		const formattedParts = parts.map((part) => {
			let formatted = capitalize(part);
			termReplacements.forEach(({ from, to }) => {
				formatted = formatted.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
			});
			return formatted;
		});

		return {
			full: formattedParts.join(' '),
			primary: formattedParts[0] || '',
			secondary: formattedParts.slice(1).join(' '),
		};
	}

	const isMobile = new IsMobile();
</script>

<svelte:window
	use:shortcut={{
		ctrl: true,
		shift: true,
		key: 'm',
		callback: () => (open = true),
	}}
/>

<Popover.Root bind:open>
	{#if enabledArr.length}
		<Popover.Trigger
			class={cn(
				'ring-offset-background focus:ring-ring flex items-center justify-between rounded-lg px-2 py-1 text-xs transition hover:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			aria-expanded={open}
		>
			<div class="flex items-center gap-2 pr-2">
				{#if currentModel && getModelIcon(currentModel.model_id)}
					{@const IconComponent = getModelIcon(currentModel.model_id)}
					<IconComponent class="size-4" />
				{/if}
				<span class="truncate">
					{currentModel ? formatModelName(currentModel.model_id).full : 'Select model'}
				</span>
			</div>
			<ChevronDownIcon class="size-4 opacity-50" />
		</Popover.Trigger>

		<Popover.Portal>
			<Popover.Content
				align="start"
				sideOffset={5}
				class="bg-popover border-border text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--bits-popover-content-transform-origin) rounded-md border shadow-md outline-hidden"
			>
				<Command.Root class="flex h-full flex-col overflow-hidden md:w-[572px]" columns={4}>
					<label class="border-border relative flex items-center gap-2 border-b px-4 py-3 text-sm">
						<SearchIcon class="text-muted-foreground" />
						<Command.Input class="w-full outline-none" placeholder="Search models..." />
					</label>
					<Command.List class="h-[300px] overflow-y-auto md:h-[430px]">
						{#each groupedModels as [company, models] (company)}
							<Command.Group class="space-y-2">
								<Command.GroupHeading
									class="text-heading/75 flex scroll-m-40 items-center gap-2 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide capitalize"
								>
									{company}
								</Command.GroupHeading>
								<Command.GroupItems
									class="flex flex-col gap-2 px-3 pb-3 md:grid md:grid-cols-4 md:gap-3"
								>
									{#each models as model (model._id)}
										{@const isSelected = settings.modelId === model.model_id}
										{@const formatted = formatModelName(model.model_id)}
										{@const openRouterModel = modelsState
											.from(Provider.OpenRouter)
											.find((m) => m.id === model.model_id)}
										{@const disabled =
											onlyImageModels && openRouterModel && !supportsImages(openRouterModel)}

										<Command.Item
											class={cn(
												'border-border flex rounded-lg border p-2',
												'relative scroll-m-36 select-none',
												'data-selected:bg-accent/50 data-selected:text-accent-foreground',
												isSelected && 'border-reflect border-none',
												isMobile.current
													? 'h-10 items-center justify-between'
													: 'h-36 w-32 flex-col items-center justify-center',
												disabled && 'opacity-50'
											)}
										>
											<div class={cn('flex items-center', isMobile.current ? 'gap-2' : 'flex-col')}>
												{#if getModelIcon(model.model_id)}
													{@const ModelIcon = getModelIcon(model.model_id)}
													<ModelIcon class="size-6 shrink-0" />
												{/if}

												<p
													class={cn(
														'font-fake-proxima text-center leading-tight font-bold',
														!isMobile.current && 'mt-2'
													)}
												>
													{isMobile.current ? formatted.full : formatted.primary}
												</p>

												{#if !isMobile.current}
													<p class="mt-0 text-center text-xs leading-tight font-medium">
														{formatted.secondary}
													</p>
												{/if}
											</div>

											{#if openRouterModel && supportsImages(openRouterModel)}
												<Tooltip>
													{#snippet trigger(tooltip)}
														<div
															class={cn(
																isMobile.current
																	? ''
																	: 'abs-x-center text-muted-foreground absolute bottom-3 flex items-center gap-1 text-xs'
															)}
															{...tooltip.trigger}
														>
															<EyeIcon class="size-3" />
														</div>
													{/snippet}
													Supports image anaylsis
												</Tooltip>
											{/if}
										</Command.Item>
									{/each}
								</Command.GroupItems>
							</Command.Group>
						{/each}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Portal>
	{/if}
</Popover.Root>
