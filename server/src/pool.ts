type Constructor<T> = new (...args: unknown[]) => T

interface Resettable<T> {
  reset?(object: T): void
}

export class Pool<T> {
  private readonly pool: T[] = []

  constructor (private readonly Type: Constructor<T> & Resettable<T>) { }

  get (...args: unknown[]): T {
    return this.pool.pop() ?? new this.Type(...args)
  }

  release (object: T): void {
    this.Type.reset?.(object)
    this.pool.push(object)
  }
}
