import type { Attachment } from 'svelte/attachments';

export function clickOutside(callback: () => void): Attachment {
	return (node) => {
		function handleClick(event: MouseEvent) {
			if (window.getSelection()?.toString()) {
				// Don't close if text is selected
				return;
			}

			// For dialog elements, check if click was on the backdrop
			if (node instanceof HTMLDialogElement) {
				const rect = node.getBoundingClientRect();
				const isInDialog =
					event.clientX >= rect.left &&
					event.clientX <= rect.right &&
					event.clientY >= rect.top &&
					event.clientY <= rect.bottom;

				if (!isInDialog) {
					callback();
					return;
				}
			}

			// For non-dialog elements, use the standard contains check
			if (!node.contains(event.target as Node) && !event.defaultPrevented) {
				callback();
			}
		}

		// For dialogs, listen on the element itself
		if (node instanceof HTMLDialogElement) {
			node.addEventListener('click', handleClick);
		} else {
			// For other elements, listen on the document
			document.addEventListener('click', handleClick, true);
		}

		return () => {
			if (node instanceof HTMLDialogElement) {
				node.removeEventListener('click', handleClick);
			} else {
				document.removeEventListener('click', handleClick, true);
			}
		};
	};
}
