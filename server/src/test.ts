import { lexer } from './lexer'
import { Parser } from './parser'
import * as fs from 'fs'
import { Environment } from './environment'

const text = fs.readFileSync(process.argv[2], "utf-8")

const { tokens, errors } = lexer.tokenize(text)

const parser = new Parser()

console.log(JSON.stringify(errors, null, '\t'))

const result = parser.parse(new Environment(), tokens)

console.log(JSON.stringify(parser.errors, null, '\t'))

console.log(JSON.stringify(result, null, '\t'))