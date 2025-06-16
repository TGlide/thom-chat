import { on } from 'svelte/events';
import { createSubscriber } from 'svelte/reactivity';

type Serializer<T> = {
	serialize: (value: T) => string;
	deserialize: (value: string) => T | undefined;
};

type StorageType = 'local' | 'session';

function getStorage(storageType: StorageType, window: Window & typeof globalThis): Storage {
	switch (storageType) {
		case 'local':
			return window.localStorage;
		case 'session':
			return window.sessionStorage;
	}
}

type PersistedObjOptions<T> = {
	/** The storage type to use. Defaults to `local`. */
	storage?: StorageType;
	/** The serializer to use. Defaults to `JSON.stringify` and `JSON.parse`. */
	serializer?: Serializer<T>;
	/** Whether to sync with the state changes from other tabs. Defaults to `true`. */
	syncTabs?: boolean;
};

export function createPersistedObj<T extends object>(
	key: string,
	initialValue: T,
	options: PersistedObjOptions<T> = {}
): T {
	const {
		storage: storageType = 'local',
		serializer = { serialize: JSON.stringify, deserialize: JSON.parse },
		syncTabs = true,
	} = options;

	let current = initialValue;
	let storage: Storage | undefined;
	let subscribe: VoidFunction | undefined;
	let version = $state(0);

	if (typeof window !== 'undefined') {
		storage = getStorage(storageType, window);
		const existingValue = storage.getItem(key);
		if (existingValue !== null) {
			const deserialized = deserialize(existingValue);
			if (deserialized) current = deserialized;
		} else {
			serialize(initialValue);
		}

		if (syncTabs && storageType === 'local') {
			subscribe = createSubscriber(() => {
				return on(window, 'storage', handleStorageEvent);
			});
		}
	}

	function handleStorageEvent(event: StorageEvent): void {
		if (event.key !== key || event.newValue === null) return;
		const deserialized = deserialize(event.newValue);
		if (deserialized) current = deserialized;
		version += 1;
	}

	function deserialize(value: string): T | undefined {
		try {
			return serializer.deserialize(value);
		} catch (error) {
			console.error(`Error when parsing "${value}" from persisted store "${key}"`, error);
			return;
		}
	}

	function serialize(value: T | undefined): void {
		try {
			if (value != undefined) {
				storage?.setItem(key, serializer.serialize(value));
			}
		} catch (error) {
			console.error(`Error when writing value from persisted store "${key}" to ${storage}`, error);
		}
	}

	const proxies = new WeakMap();
	const root = current;

	const proxy = (value: unknown) => {
		if (value === null || value?.constructor.name === 'Date' || typeof value !== 'object') {
			return value;
		}

		let p = proxies.get(value);
		if (!p) {
			p = new Proxy(value, {
				get: (target, property) => {
					subscribe?.();
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					version;
					return proxy(Reflect.get(target, property));
				},
				set: (target, property, value) => {
					version += 1;
					Reflect.set(target, property, value);
					serialize(root);
					return true;
				},
			});
			proxies.set(value, p);
		}
		return p;
	};

	return proxy(root);
}
