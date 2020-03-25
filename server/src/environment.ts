import { Parser } from './parser'
import { Pool } from './pool'

const parsers = new Pool(Parser)

export class Environment {
  // TODO: Implement environment manager
}

export const environment = new Environment()