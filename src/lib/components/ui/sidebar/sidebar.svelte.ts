import { IsMobile } from '$lib/hooks/is-mobile.svelte';
import { Context } from 'runed';

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

	closeMobile() {
		if (this.isMobile.current) {
			this.openMobile = false;
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

export class SidebarSidebarState {
	constructor(readonly root: SidebarRootState) {}
}

export class SidebarControlState {
	constructor(readonly root: SidebarRootState) {
		this.closeMobile = this.closeMobile.bind(this);
	}

	closeMobile() {
		this.root.closeMobile();
	}
}

export const ctx = new Context<SidebarRootState>('sidebar-root-context');

export function useSidebar() {
	return ctx.set(new SidebarRootState());
}

export function useSidebarTrigger() {
	return new SidebarTriggerState(ctx.get());
}

export function useSidebarSidebar() {
	return new SidebarSidebarState(ctx.get());
}

export function useSidebarControls() {
	return new SidebarControlState(ctx.get());
}
