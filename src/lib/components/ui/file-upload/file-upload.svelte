<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte';
	import { cn } from '$lib/utils/utils';
	import { useConvexClient } from 'convex-svelte';
	import { FileUpload } from 'melt/builders';
	import ImageIcon from '~icons/lucide/image';
	import XIcon from '~icons/lucide/x';

	type Props = {
		onFilesSelected?: (files: { url: string; storage_id: string }[]) => void;
		selectedFiles?: { url: string; storage_id: string }[];
		class?: string;
		disabled?: boolean;
	};

	let { onFilesSelected, selectedFiles = $bindable([]), class: className, disabled = false }: Props = $props();

	const client = useConvexClient();
	const fileUpload = new FileUpload({
		multiple: true,
		accept: 'image/*',
		maxSize: 10 * 1024 * 1024, // 10MB
	});

	let isUploading = $state(false);

	async function handleFileChange(files: File[]) {
		if (!files.length || !session.current?.session.token) return;

		isUploading = true;
		const uploadedFiles: { url: string; storage_id: string }[] = [];

		try {
			for (const file of files) {
				// Generate upload URL
				const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {
					session_token: session.current.session.token,
				});

				// Upload file
				const result = await fetch(uploadUrl, {
					method: 'POST',
					body: file,
				});

				if (!result.ok) {
					throw new Error(`Upload failed: ${result.statusText}`);
				}

				const { storageId } = await result.json();

				// Get the URL for the uploaded file
				const url = await client.query(api.storage.getUrl, {
					storage_id: storageId,
					session_token: session.current.session.token,
				});

				if (url) {
					uploadedFiles.push({ url, storage_id: storageId });
				}
			}

			const newFiles = [...selectedFiles, ...uploadedFiles];
			onFilesSelected?.(newFiles);
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			isUploading = false;
		}
	}

	function removeFile(index: number) {
		const newFiles = selectedFiles.filter((_, i) => i !== index);
		onFilesSelected?.(newFiles);
	}

	$effect(() => {
		if (fileUpload.selected.size > 0) {
			handleFileChange(Array.from(fileUpload.selected));
			fileUpload.clear();
		}
	});
</script>

<div class={cn('flex flex-col gap-2', className)}>
	{#if selectedFiles.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedFiles as file, index}
				<div class="relative">
					<img src={file.url} alt="Uploaded" class="h-16 w-16 rounded-lg object-cover" />
					<button
						type="button"
						onclick={() => removeFile(index)}
						class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
					>
						<XIcon class="h-3 w-3" />
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<div>
		<input {...fileUpload.input} />
		<div
			{...fileUpload.dropzone}
			class={cn(
				'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-gray-400',
				{
					'border-blue-400 bg-blue-50': fileUpload.isDragging,
					'opacity-50 cursor-not-allowed': disabled || isUploading,
				}
			)}
		>
			{#if isUploading}
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
				<p class="mt-2 text-sm text-gray-600">Uploading...</p>
			{:else if fileUpload.isDragging}
				<ImageIcon class="h-8 w-8 text-blue-500" />
				<p class="mt-2 text-sm text-blue-600">Drop images here</p>
			{:else}
				<ImageIcon class="h-8 w-8 text-gray-400" />
				<p class="mt-2 text-sm text-gray-600">
					Click to upload or drag and drop images
				</p>
				<p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
			{/if}
		</div>
	</div>
</div>