interface CacheNode<K, V> {
  key: K;
  value: V;
  size: number;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

export class LRUCache<K = string, V = unknown> {
  private capacity: number;
  private currentSize = 0;
  private cache = new Map<K, CacheNode<K, V>>();
  private head: CacheNode<K, V> | null = null;
  private tail: CacheNode<K, V> | null = null;

  constructor(maxSizeBytes = 1024 * 1024) {
    this.capacity = maxSizeBytes;
  }

  private calculateSize(value: V): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return JSON.stringify(value).length * 2;
    }
  }

  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private addToHead(node: CacheNode<K, V>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private evictLRU(): void {
    while (this.tail && this.currentSize > this.capacity) {
      const lastNode = this.tail;
      this.removeNode(lastNode);
      this.cache.delete(lastNode.key);
      this.currentSize -= lastNode.size;
    }
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;

    this.removeNode(node);
    this.addToHead(node);

    return node.value;
  }

  set(key: K, value: V): void {
    const size = this.calculateSize(value);
    
    if (size > this.capacity) {
      return;
    }

    const existingNode = this.cache.get(key);
    
    if (existingNode) {
      existingNode.value = value;
      this.currentSize = this.currentSize - existingNode.size + size;
      existingNode.size = size;
      this.removeNode(existingNode);
      this.addToHead(existingNode);
    } else {
      const newNode: CacheNode<K, V> = {
        key,
        value,
        size,
        prev: null,
        next: null,
      };

      this.currentSize += size;
      this.cache.set(key, newNode);
      this.addToHead(newNode);
    }

    this.evictLRU();
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    this.currentSize -= node.size;
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.currentSize = 0;
  }

  get size(): number {
    return this.cache.size;
  }

  get bytes(): number {
    return this.currentSize;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}