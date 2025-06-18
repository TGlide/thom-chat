<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { cn } from '$lib/utils/utils';
	import { Command } from 'bits-ui';
	import ChevronDownIcon from '~icons/lucide/chevron-down';
	import SearchIcon from '~icons/lucide/search';
	// Company icons from simple-icons
	import GoogleIcon from '~icons/simple-icons/google';
	import MetaIcon from '~icons/simple-icons/meta';
	import MicrosoftIcon from '~icons/simple-icons/microsoft';
	import OpenaiIcon from '~icons/simple-icons/openai';
	import XIcon from '~icons/simple-icons/x';
	import BrainIcon from '~icons/lucide/brain';
	import CpuIcon from '~icons/lucide/cpu';
	import ZapIcon from '~icons/lucide/zap';
	// Model-specific icons
	import Cohere from '$lib/components/icons/cohere.svelte';
	import Deepseek from '$lib/components/icons/deepseek.svelte';
	import { Popover } from 'melt/builders';
	import type { Component } from 'svelte';
	import LogosClaudeIcon from '~icons/logos/claude-icon';
	import LogosMistralAiIcon from '~icons/logos/mistral-ai-icon';
	import MaterialIconThemeGeminiAi from '~icons/material-icon-theme/gemini-ai';
	import { capitalize } from '$lib/utils/strings';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();

	const enabledModelsQuery = useCachedQuery(api.user_enabled_models.get_enabled, {
		session_token: session.current?.session.token ?? '',
	});

	const enabledArr = $derived(Object.values(enabledModelsQuery.data ?? {}));

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

	function getModelIcon(modelId: string): typeof LogosClaudeIcon | null {
		const id = modelId.toLowerCase();

		if (id.includes('claude') || id.includes('anthropic')) return LogosClaudeIcon;
		if (id.includes('gemini') || id.includes('gemma')) return MaterialIconThemeGeminiAi;
		if (id.includes('mistral') || id.includes('mixtral')) return LogosMistralAiIcon;

		return null;
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

	// Group models by company
	const groupedModels = $derived.by(() => {
		const groups: Record<string, typeof enabledArr> = {};

		enabledArr.forEach((model) => {
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
		popover.open = false;
	}

	let open = $state(false);
	const popover = new Popover({
		open: () => open,
		onOpenChange: (v) => {
			if (v === open) return;
			open = v;
			if (v) return;
			document.getElementById(popover.trigger.id)?.focus();
		},
		floatingConfig: {
			computePosition: { placement: 'top-start' },
		},
	});

	// Term replacements for proper formatting
	const termReplacements = [
		{ from: 'gpt', to: 'GPT' },
		{ from: 'claude', to: 'Claude' },
		{ from: 'deepseek', to: 'DeepSeek' },
		{ from: 'o3', to: 'o3' },
	];

	// Name splitter. splits -,_,:
	function splitName(name: string) {
		return name.split(/[-_,:]/).map((s) => formatTerms(s));
	}

	function formatTerms(text: string): string {
		return termReplacements.reduce((result, { from, to }) => {
			const capitalized = capitalize(result);
			return capitalized.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
		}, text);
	}

	function getModelTitle(modelId: string) {
		const sn = splitName(modelId.replace(/^[^/]+\//, ''));
		const title = sn[0] + (sn.length > 1 ? ' ' + sn.slice(1).join(' ') : '');
		return formatTerms(title);
	}
</script>

{#if enabledArr.length === 0}
	<!-- Fallback to original select if no models are loaded -->
	<select bind:value={settings.modelId} class={cn('border-border border', className)}>
		<option value="">Loading models...</option>
	</select>
{:else}
	<button
		{...popover.trigger}
		class={cn(
			'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		aria-expanded={open}
	>
		<div class="flex items-center gap-2">
			{#if companyIcons[currentCompany]}
				{@const IconComponent = companyIcons[currentCompany]}
				<IconComponent class="size-4" />
			{/if}
			<span class="truncate capitalize">
				{currentModel ? getModelTitle(currentModel.model_id) : 'Select model'}
			</span>
		</div>
		<ChevronDownIcon class="size-4 opacity-50" />
	</button>

	<div
		{...popover.content}
		class="border-border bg-popover mt-1 max-h-200 min-w-80 flex-col overflow-hidden rounded-xl border p-0 backdrop-blur-sm data-[open]:flex"
	>
		<Command.Root class="flex h-full flex-col overflow-hidden" columns={4}>
			<label class="group/label relative flex items-center gap-2 px-4 py-3 text-sm">
				<SearchIcon class="text-muted-foreground" />
				<Command.Input
					class="w-full outline-none"
					placeholder="Search models..."
					{@attach (node) => {
						if (popover.open) {
							node.focus();
						}
						return () => {
							node.value = '';
						};
					}}
				/>
				<div
					class="border-border/50 group-focus-within/label:border-foreground/30 absolute inset-x-2 bottom-0 h-1 border-b"
					aria-hidden="true"
				></div>
			</label>
			<Command.List class="overflow-y-auto">
				<Command.Viewport>
					<Command.Empty class="text-muted-foreground p-4 text-sm">
						No models available. Enable some models in the account settings.
					</Command.Empty>
					{#each groupedModels as [company, models] (company)}
						<Command.Group class="space-y-2">
							<Command.GroupHeading
								class="text-heading/75 flex items-center gap-2 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide capitalize"
							>
								{company}
							</Command.GroupHeading>
							<Command.GroupItems class="grid grid-cols-4 gap-3 px-3 pb-3">
								{#each models as model (model._id)}
									{@const isSelected = settings.modelId === model.model_id}
									{@const sn = splitName(model.model_id.replace(/^[^/]+\//, ''))}
									<Command.Item
										value={model.model_id}
										onSelect={() => selectModel(model.model_id)}
										class={cn(
											'border-border flex h-40 w-32 flex-col items-center justify-center rounded-lg border p-2',
											'select-none',
											'data-selected:bg-accent/50 data-selected:text-accent-foreground',
											isSelected && 'border-reflect border-none',
											'scroll-m-10'
										)}
									>
										{#if getModelIcon(model.model_id)}
											{@const ModelIcon = getModelIcon(model.model_id)}
											<ModelIcon class="size-6 shrink-0" />
										{:else if companyIcons[getCompanyFromModelId(model.model_id)]}
											{@const CompanyIcon = companyIcons[getCompanyFromModelId(model.model_id)]}
											<CompanyIcon class="size-6 shrink-0" />
										{/if}
										<p class="font-fake-proxima mt-2 text-center leading-tight font-bold">
											{sn[0]}
										</p>
										<p class="mt-0 text-center text-xs leading-tight font-medium">
											{sn.slice(1).join(' ')}
										</p>
									</Command.Item>
								{/each}
							</Command.GroupItems>
						</Command.Group>
					{/each}
				</Command.Viewport>
			</Command.List>
		</Command.Root>
	</div>
{/if}
