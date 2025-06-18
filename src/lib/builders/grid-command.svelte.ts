import { getNextMatrixItem, type Direction } from '$lib/utils/array';
import { dataAttr } from '$lib/utils/attribute';
import type { MaybeGetter } from 'melt';
import { extract } from 'runed';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

export type GridCommandProps = {
	columns: MaybeGetter<number>;
	onSelect: (value: string) => void;
};
export class GridCommand {
	/* State */
	rootEl: HTMLElement | null = null;
	highlighted = $state<string>();
	inputValue = $state('');

	/* Props */
	columns: number;
	onSelect: (value: string) => void;

	constructor(props: GridCommandProps) {
		this.columns = $derived(extract(props.columns));
		this.onSelect = props.onSelect;
	}

	get root() {
		return {
			[createAttachmentKey()]: (node) => {
				this.rootEl = node;
				return () => {
					if (this.rootEl !== node) return;
					this.rootEl = null;
				};
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get group() {
		return {
			'data-thom-grid-command-group': '',
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get groupHeading() {
		return {
			'data-thom-grid-command-group-heading': '',
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get input() {
		return {
			value: this.inputValue,
			oninput: async (e) => {
				this.inputValue = e.currentTarget.value;
				await tick();
				const items = this.getItems();
				const highlightedEl = items.find((item) => item.dataset.value === this.highlighted);
				if (!highlightedEl) {
					const firstItem = items[0];
					if (!firstItem) this.highlighted = undefined;
					else this.highlighted = firstItem.dataset.value;
				}
			},
			onkeydown: (e) => {
				const rows = this.getRows();
				if (rows.length === 0) return;

				const row = rows.findIndex((row) => {
					return !!row.find((item) => {
						return this.highlighted === item.dataset.value;
					});
				});

				if (row === -1) return;
				const col = rows[row]!.findIndex((item) => this.highlighted === item.dataset.value);

				const dirMap: Record<string, Direction> = {
					ArrowUp: 'up',
					ArrowDown: 'down',
					ArrowLeft: 'left',
					ArrowRight: 'right',
				};
				const dir = dirMap[e.key];
				if (dir) {
					const next = getNextMatrixItem({
						matrix: rows,
						currentRow: row,
						currentCol: col,
						direction: dir,
						isAvailable: (item) => item.dataset.disabled === undefined,
					});
					if (next) {
						this.highlighted = next.dataset.value;
						this.scrollToHighlighted();
					}
					return;
				}

				if (e.key === 'Enter' && this.highlighted) {
					e.preventDefault();
					this.onSelect(this.highlighted);
				}
			},
		} as const satisfies HTMLInputAttributes;
	}

	scrollToHighlighted() {
		const groups = this.getGroups();
		const items = groups.flatMap((group) => group);
		const highlightedEl = items.find((item) => item.dataset.value === this.highlighted);
		if (!highlightedEl) return;

		const nextGroupIdx = groups.findIndex((group) => group.includes(highlightedEl));
		const nextGroup = groups[nextGroupIdx]!;
		const nextItemIdx = nextGroup.findIndex((item) => item === highlightedEl);
		const nextItemRow = Math.floor(nextItemIdx / this.columns);
		if (nextItemRow === 0) {
			const nextGroupEl = Array.from(
				this.rootEl!.querySelectorAll('[data-thom-grid-command-group]')
			)[nextGroupIdx];
			const nextGroupHeadingEl = nextGroupEl?.querySelector(
				'[data-thom-grid-command-group-heading]'
			);
			if (nextGroupHeadingEl) {
				nextGroupHeadingEl.scrollIntoView({ block: 'nearest' });
			}
		}
		highlightedEl.scrollIntoView({ block: 'nearest' });
	}

	getRows() {
		const groups = this.getGroups();
		if (groups.length === 0) return [];

		// split groups into rows
		const rows: Array<HTMLElement[]> = [];

		for (let i = 0; i < groups.length; i++) {
			const items = [...groups[i]!];

			let row: HTMLElement[] = [];
			while (items.length > 0) {
				const item = items.shift()!;
				row.push(item);
				if (row.length === this.columns) {
					rows.push(row);
					row = [];
				}
			}
			if (row.length > 0) {
				rows.push(row);
			}
		}

		return rows;
	}

	getGroups() {
		if (!this.rootEl) return [];

		const groups = Array.from(this.rootEl.querySelectorAll('[data-thom-grid-command-group]'));

		const result: Array<HTMLElement[]> = [];

		for (const group of groups) {
			const groupItems = Array.from(
				group.querySelectorAll('[data-thom-grid-command-item]')
			) as HTMLElement[];

			result.push(groupItems);
		}

		return result;
	}

	getItems() {
		return this.getRows()
			.flatMap((row) => row)
			.filter((item) => !item.dataset.disabled);
	}

	getItem(value: string, args: { disabled?: boolean } = {}) {
		return {
			'data-thom-grid-command-item': '',
			'data-highlighted': dataAttr(value === this.highlighted),
			'data-value': dataAttr(value),
			'data-disabled': dataAttr(args?.disabled),
			onmouseover: () => {
				if (args?.disabled) return;
				this.highlighted = value;
			},
			onclick: () => {
				if (args?.disabled) return;
				this.onSelect(value);
			},
			[createAttachmentKey()]: () => {
				if (!this.highlighted) {
					this.highlighted = value;
				}
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}
}
