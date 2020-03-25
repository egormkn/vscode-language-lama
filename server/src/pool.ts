interface Constructable<T> {
  new(): T;
}

interface Resettable<T> {
  reset?(object: T): void;
}

/**
 * Simple object pool
 */
export class Pool<T> {
  private pool: T[] = [];

  constructor (private type: Constructable<T> & Resettable<T>) { }

  get (): T {
    return this.pool.pop() ?? new this.type()
  }

  release (object: T): void {
    this.type.reset?.(object)
    this.pool.push(object)
  }
}

