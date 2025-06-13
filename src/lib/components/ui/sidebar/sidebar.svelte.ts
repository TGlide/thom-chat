import { Context } from 'runed';

export class SidebarRootState {
	open = $state(true);

	constructor() {
		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		this.open = !this.open;
	}
}

export class SidebarTriggerState {
	constructor(private root: SidebarRootState) {
		this.toggle = this.toggle.bind(this);
	}

	toggle() {
		this.root.toggle();
	}
}

export const ctx = new Context<SidebarRootState>('sidebar-root-context');

export function useSidebar() {
	return ctx.set(new SidebarRootState());
}

export function useSidebarTrigger() {
	return new SidebarTriggerState(ctx.get());
}
