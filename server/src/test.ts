import { createToken, Lexer, CstParser } from 'chevrotain'

const Identifier = createToken({ name: "Identifier", pattern: /[a-z][a-zA-Z_0-9]*/ })
const InfixAny = createToken({ name: "InfixAny", pattern: Lexer.NA })
const InfixL = createToken({ name: "InfixL", pattern: /infixl/, longer_alt: Identifier, categories: [InfixAny] })
const InfixR = createToken({ name: "InfixR", pattern: /infixr/, longer_alt: Identifier, categories: [InfixAny] })
const Infix = createToken({ name: "Infix", pattern: /infix/, longer_alt: Identifier, categories: [InfixAny] })

const vocabulary = [InfixL, InfixR, Infix, Identifier]

const testLexer = new Lexer(vocabulary, {
    traceInitPerf: true
})

const { tokens } = testLexer.tokenize('infixr')

class Parser extends CstParser {

    constructor () {
        super(vocabulary, {
            traceInitPerf: true
        })
        this.performSelfAnalysis()
    }
  
    public parse = this.RULE("parse", () => {
        this.CONSUME(InfixAny)
    })
}

const parser = new Parser()

parser.input = tokens

parser.parse()

console.log(JSON.stringify(parser.errors, null, '\t'))