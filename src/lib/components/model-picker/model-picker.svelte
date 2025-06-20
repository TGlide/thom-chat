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
	import { type Component } from 'svelte';
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
	import { Command } from 'bits-ui';
	import * as Popover from '$lib/components/ui/popover';
	import { shortcut } from '$lib/actions/shortcut.svelte';
	import { Button } from '../ui/button';
	import ChevronLeftIcon from '~icons/lucide/chevron-left';
	import { Kbd } from '../ui/kbd';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte';
	import { useConvexClient } from 'convex-svelte';
	import type { Id } from '$lib/backend/convex/_generated/dataModel';
	import { ResultAsync } from 'neverthrow';
	import PinIcon from '~icons/lucide/pin';
	import PinOffIcon from '~icons/lucide/pin-off';
	import { isPinned } from '$lib/backend/convex/user_enabled_models';

	type Props = {
		class?: string;
		/* When images are attached, we should not select models that don't support images */
		onlyImageModels?: boolean;
	};

	let { class: className, onlyImageModels }: Props = $props();

	const client = useConvexClient();

	const enabledModelsQuery = useCachedQuery(api.user_enabled_models.get_enabled, {
		session_token: session.current?.session.token ?? '',
	});

	const enabledArr = $derived(Object.values(enabledModelsQuery.data ?? {}));

	modelsState.init();

	// Company icon mapping
	const companyIcons: Record<string, Component> = {
		openai: OpenaiIcon,
		anthropic: LogosClaudeIcon,
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
	let view = $state<'favorites' | 'enabled'>('favorites');
	let activeModel = $state('');

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

	function modelSelected(modelId: string) {
		settings.modelId = modelId;
		open = false;
	}

	function toggleView() {
		view = view === 'favorites' ? 'enabled' : 'favorites';
	}

	let pinning = $state(false);

	async function togglePin(modelId: Id<'user_enabled_models'>) {
		pinning = true;

		await ResultAsync.fromPromise(
			client.mutation(api.user_enabled_models.toggle_pinned, {
				session_token: session.current?.session.token ?? '',
				enabled_model_id: modelId,
			}),
			(e) => e
		);

		pinning = false;
	}

	const isMobile = new IsMobile();

	const activeModelInfo = $derived.by(() => {
		if (activeModel === '') return null;

		const model = enabledArr.find((m) => m.model_id === activeModel);

		if (!model) return null;

		return {
			...model,
			formatted: formatModelName(activeModel),
		};
	});

	const pinnedModels = $derived(enabledArr.filter((m) => isPinned(m)));
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
		>
			<div class="flex items-center gap-2 pr-2">
				{#if currentModel && getModelIcon(currentModel.model_id)}
					{@const IconComponent = getModelIcon(currentModel.model_id)}
					<IconComponent class="size-3" />
				{/if}
				<span class="truncate">
					{currentModel ? formatModelName(currentModel.model_id).full : 'Select model'}
				</span>
			</div>
			<ChevronDownIcon class="size-4 opacity-50" />
		</Popover.Trigger>

		<Popover.Content
			align="start"
			sideOffset={5}
			class={cn('p-0 transition-all', {
				'w-[572px]': !isMobile.current && view === 'enabled',
				'w-[300px]': view === 'favorites',
				'max-w-[calc(100vw-2rem)]': isMobile.current,
			})}
		>
			<Command.Root
				class={cn('flex h-full w-full flex-col overflow-hidden')}
				bind:value={activeModel}
				columns={view === 'favorites' ? undefined : isMobile.current ? 2 : 4}
			>
				<label class="border-border relative flex items-center gap-2 border-b px-4 py-3 text-sm">
					<SearchIcon class="text-muted-foreground" />
					<Command.Input
						class="w-full outline-none"
						placeholder="Search models..."
						onkeydown={(e) => {
							if (e.ctrlKey || e.metaKey) {
								if (e.key === 'ArrowRight') {
									e.preventDefault();
									e.stopPropagation();
									view = 'enabled';
								} else if (e.key === 'ArrowLeft') {
									e.preventDefault();
									e.stopPropagation();
									view = 'favorites';
								} else if (e.key === 'u') {
									if (activeModelInfo) {
										e.preventDefault();
										e.stopPropagation();
										togglePin(activeModelInfo._id);
									}
								}
							}
						}}
					/>
				</label>
				<Command.List
					class={cn('overflow-y-auto transition-all', {
						'h-[430px]': view === 'enabled',
						'flex flex-col gap-1 p-1': view === 'favorites',
					})}
					style="height: {view === 'enabled'
						? '430px'
						: `min(300px, ${pinnedModels.length * 44 + 4}px)`};"
				>
					{#if view === 'favorites' && pinnedModels.length > 0}
						{#each pinnedModels as model (model._id)}
							{@const formatted = formatModelName(model.model_id)}
							{@const openRouterModel = modelsState
								.from(Provider.OpenRouter)
								.find((m) => m.id === model.model_id)}
							{@const disabled =
								onlyImageModels && openRouterModel && !supportsImages(openRouterModel)}

							<Command.Item
								value={model.model_id}
								class={cn(
									'bg-popover flex rounded-lg p-2',
									'relative scroll-m-36 select-none',
									'data-selected:bg-accent/50 data-selected:text-accent-foreground',
									'h-10 items-center justify-between',
									disabled && 'opacity-50'
								)}
								onSelect={() => modelSelected(model.model_id)}
							>
								<div class={cn('flex items-center gap-2')}>
									{#if getModelIcon(model.model_id)}
										{@const ModelIcon = getModelIcon(model.model_id)}
										<ModelIcon class="size-4 shrink-0" />
									{/if}

									<p class={cn('font-fake-proxima text-center text-sm leading-tight font-bold')}>
										{formatted.full}
									</p>
								</div>

								{#if openRouterModel && supportsImages(openRouterModel)}
									<Tooltip>
										{#snippet trigger(tooltip)}
											<div class={cn('')} {...tooltip.trigger}>
												<EyeIcon class="size-3" />
											</div>
										{/snippet}
										Supports image analysis
									</Tooltip>
								{/if}
							</Command.Item>
						{/each}
					{:else if view === 'enabled'}
						{#if pinnedModels.length > 0}
							<Command.Group class="space-y-2">
								<Command.GroupHeading
									class="text-heading/75 flex scroll-m-40 items-center gap-2 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide capitalize"
								>
									Pinned
								</Command.GroupHeading>
								<Command.GroupItems class="grid grid-cols-2 gap-3 px-3 pb-3 md:grid-cols-4">
									{#each pinnedModels as model (model._id)}
										{@const formatted = formatModelName(model.model_id)}
										{@const openRouterModel = modelsState
											.from(Provider.OpenRouter)
											.find((m) => m.id === model.model_id)}
										{@const disabled =
											onlyImageModels && openRouterModel && !supportsImages(openRouterModel)}

										<Command.Item
											value={model.model_id}
											class={cn(
												'border-border bg-popover group/item flex rounded-lg border p-2',
												'relative scroll-m-36 select-none',
												'data-selected:bg-accent/50 data-selected:text-accent-foreground',
												'h-36 w-32 flex-col items-center justify-center',
												disabled && 'opacity-50'
											)}
											onSelect={() => modelSelected(model.model_id)}
										>
											<div class={cn('flex flex-col items-center')}>
												{#if getModelIcon(model.model_id)}
													{@const ModelIcon = getModelIcon(model.model_id)}
													<ModelIcon class="size-4 shrink-0 md:size-6" />
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
													Supports image analysis
												</Tooltip>
											{/if}

											<div
												class="bg-popover absolute top-1 right-1 rounded-md p-1 opacity-0 transition-opacity group-hover/item:opacity-100"
											>
												<Button
													variant="ghost"
													size="icon"
													class="size-7"
													onclick={(e: MouseEvent) => {
														e.stopPropagation();
														togglePin(model._id);
													}}
												>
													{#if isPinned(model)}
														<PinOffIcon class="size-4" />
													{:else}
														<PinIcon class="size-4" />
													{/if}
												</Button>
											</div>
										</Command.Item>
									{/each}
								</Command.GroupItems>
							</Command.Group>
						{/if}
						{#each groupedModels as [company, models] (company)}
							{@const filteredModels = models.filter((m) => !isPinned(m))}
							{#if filteredModels.length > 0}
								<Command.Group class="space-y-2">
									<Command.GroupHeading
										class="text-heading/75 flex scroll-m-40 items-center gap-2 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide capitalize"
									>
										{company}
									</Command.GroupHeading>
									<Command.GroupItems class="grid grid-cols-2 gap-3 px-3 pb-3 md:grid-cols-4">
										{#each filteredModels as model (model._id)}
											{@const formatted = formatModelName(model.model_id)}
											{@const openRouterModel = modelsState
												.from(Provider.OpenRouter)
												.find((m) => m.id === model.model_id)}
											{@const disabled =
												onlyImageModels && openRouterModel && !supportsImages(openRouterModel)}

											<Command.Item
												value={model.model_id}
												class={cn(
													'border-border bg-popover group/item flex rounded-lg border p-2',
													'relative scroll-m-36 select-none',
													'data-selected:bg-accent/50 data-selected:text-accent-foreground',
													'h-36 w-32 flex-col items-center justify-center',
													disabled && 'opacity-50'
												)}
												onSelect={() => modelSelected(model.model_id)}
											>
												<div class={cn('flex flex-col items-center')}>
													{#if getModelIcon(model.model_id)}
														{@const ModelIcon = getModelIcon(model.model_id)}
														<ModelIcon class="size-4 shrink-0 md:size-6" />
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
														Supports image analysis
													</Tooltip>
												{/if}

												<div
													class="bg-popover absolute top-1 right-1 rounded-md p-1 opacity-0 transition-opacity group-hover/item:opacity-100"
												>
													<Button
														variant="ghost"
														size="icon"
														class="size-7"
														onclick={(e: MouseEvent) => {
															e.stopPropagation();
															togglePin(model._id);
														}}
													>
														{#if isPinned(model)}
															<PinOffIcon class="size-4" />
														{:else}
															<PinIcon class="size-4" />
														{/if}
													</Button>
												</div>
											</Command.Item>
										{/each}
									</Command.GroupItems>
								</Command.Group>
							{/if}
						{/each}
					{/if}
				</Command.List>
			</Command.Root>
			<div class="border-border flex place-items-center justify-between border-t p-2">
				<Button variant="ghost" size="sm" onclick={toggleView} class="h-7 text-sm font-normal">
					<ChevronLeftIcon
						class={cn('size-4 rotate-90 transition-all', { 'rotate-0': view === 'enabled' })}
					/>
					{view === 'favorites' ? 'Show enabled' : 'Show favorites'}
					{#if !isMobile.current}
						<span>
							<Kbd size="xs">{cmdOrCtrl}</Kbd>
							<Kbd size="xs">{view === 'favorites' ? '→' : '←'}</Kbd>
						</span>
					{/if}
				</Button>
				{#if !isMobile.current && activeModelInfo && view === 'enabled'}
					<div>
						<Button
							variant="ghost"
							loading={pinning}
							class="bg-popover"
							size="sm"
							onclick={() => togglePin(activeModelInfo._id)}
						>
							<span class="text-muted-foreground">
								{isPinned(activeModelInfo) ? 'Unpin' : 'Pin'}
							</span>
							<span>
								<Kbd size="xs">{cmdOrCtrl}</Kbd>
								<Kbd size="xs">U</Kbd>
							</span>
						</Button>
					</div>
				{/if}
			</div>
		</Popover.Content>
	{/if}
</Popover.Root>
