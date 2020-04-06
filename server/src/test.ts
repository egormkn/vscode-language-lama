import { lexer } from './lexer'

console.log(JSON.stringify(lexer.tokenize('-1'), null, 2))
