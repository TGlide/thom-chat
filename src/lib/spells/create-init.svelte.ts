export function createInit(cb: () => void) {
	let called = $state(false);

	function init() {
		if (called) return;
		called = true;
		cb();
	}

	return Object.defineProperties(init, {
		called: {
			get() {
				return called;
			},
			enumerable: true,
		},
	}) as typeof init & { readonly called: boolean };
}
