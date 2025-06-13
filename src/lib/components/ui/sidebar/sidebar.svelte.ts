import { IsMobile } from '$lib/hooks/is-mobile.svelte';
import { Context } from 'runed';
import type { ReadableBoxedValues } from 'svelte-toolbelt';

export class SidebarRootState {
	open = $state(true);
	openMobile = $state(false);
	isMobile = new IsMobile();

	showSidebar = $derived(this.isMobile.current ? this.openMobile : this.open);

	constructor() {
		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		if (this.isMobile.current) {
			this.openMobile = !this.openMobile;
		} else {
			this.open = !this.open;
		}
	}
}

export class SidebarTriggerState {
	constructor(readonly root: SidebarRootState) {
		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		this.root.toggle();
	}
}

type SidebarSidebarProps = ReadableBoxedValues<{ 
	dialogRef: HTMLDialogElement | null;
}>

export class SidebarSidebarState {
	constructor(readonly root: SidebarRootState, readonly props: SidebarSidebarProps) {

		$effect(()  => {
			if (!this.root.isMobile.current) {
				this.props.dialogRef.current?.close();
				return;
			}

			if (this.root.openMobile) {
				this.props.dialogRef.current?.showModal();
			} else {
				this.props.dialogRef.current?.close();
			}
		})
	}
}

export const ctx = new Context<SidebarRootState>('sidebar-root-context');

export function useSidebar() {
	return ctx.set(new SidebarRootState());
}

export function useSidebarTrigger() {
	return new SidebarTriggerState(ctx.get());
}

export function useSidebarSidebar(props: SidebarSidebarProps) {
	return new SidebarSidebarState(ctx.get(), props);
}
