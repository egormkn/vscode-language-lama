interface Entity<T extends string> {
  type: T
  identifier: string
}

export type Function = Entity<'F'>
export type Variable = Entity<'V'>
export type Import = Entity<'I'>
export type Infix = Entity<'L' | 'R' | 'N'> & {
  mode: 'at' | 'after' | 'before'
  other: string
}

export type InterfaceItem = Function | Variable | Import | Infix
export type Interface = ArrayLike<InterfaceItem>
