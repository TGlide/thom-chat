import type { HTMLAttributes } from 'svelte/elements';
import GitHub from './github.svelte';
import TypeScript from './typescript.svelte';
import Svelte from './svelte.svelte';
import Branch from './branch.svelte';
import BranchAndRegen from './branch-and-regen.svelte';

export interface Props extends HTMLAttributes<SVGElement> {
	class?: string;
	width?: number;
	height?: number;
}

export { GitHub, TypeScript, Svelte, Branch, BranchAndRegen };
