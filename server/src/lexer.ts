import { createToken, Lexer } from 'chevrotain'

const UIdentifier = createToken({ name: "UIdentifier", pattern: /[A-Z][a-zA-Z_0-9]*/ })
const LIdentifier = createToken({ name: "LIdentifier", pattern: /[a-z][a-zA-Z_0-9]*/ })
const DecimalLiteral = createToken({ name: "DecimalLiteral", pattern: /[0-9]+/ })
const StringLiteral = createToken({ name: "StringLiteral", pattern: /"([^"]|"")*"/ })
const CharLiteral = createToken({ name: "CharLiteral", pattern: /'([^']|''|\\n|\\t)'/ })

const Operator = createToken({ name: "Operator", pattern: /[+*/%$#@!|&^~?<>:=-]+/ })

const Arrow = createToken({ name: "Arrow", label: "->", pattern: /->/, longer_alt: Operator, categories: [Operator] })
const AtSign = createToken({ name: "AtSign", label: "@", pattern: /@/, longer_alt: Operator, categories: [Operator] })
const Bar = createToken({ name: "Bar", label: "|", pattern: /\|/, longer_alt: Operator, categories: [Operator] })
const Colon = createToken({ name: "Colon", label: ":", pattern: /:/, longer_alt: Operator, categories: [Operator] })
const Equal = createToken({ name: "Equal", label: "=", pattern: /=/, longer_alt: Operator, categories: [Operator] })
const Hash = createToken({ name: "Hash", label: "#", pattern: /#/, longer_alt: Operator, categories: [Operator] })
const Minus = createToken({ name: "Minus", label: "-", pattern: /-/, longer_alt: Arrow, categories: [Operator] })

const Comma = createToken({ name: "Comma", label: ",", pattern: /,/ })
const Dot = createToken({ name: "Dot", label: ".", pattern: /\./ })
const LCurly = createToken({ name: "LCurly", label: '{', pattern: /{/ })
const RCurly = createToken({ name: "RCurly", label: "}", pattern: /}/ })
const LRound = createToken({ name: "LRound", label: "(", pattern: /\(/ })
const RRound = createToken({ name: "RRound", label: ")", pattern: /\)/ })
const LSquare = createToken({ name: "LSquare", label: "[", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", label: "]", pattern: /\]/ })
const Semicolon = createToken({ name: "Semicolon", label: ";", pattern: /;/ })
const Underscore = createToken({ name: "Underscore", label: "_", pattern: /_/ })

const Shape = createToken({ name: "Shape", pattern: Lexer.NA })
const InfixType = createToken({ name: "InfixType", pattern: Lexer.NA })
const InfixLevel = createToken({ name: "InfixLevel", pattern: Lexer.NA })
const BooleanLiteral = createToken({ name: "BooleanLiteral", pattern: Lexer.NA })

const After = createToken({ name: "After", pattern: /after/, longer_alt: LIdentifier, categories: [InfixLevel] })
const Array = createToken({ name: "Array", pattern: /array/, longer_alt: LIdentifier, categories: [Shape] })
const At = createToken({ name: "At", pattern: /at/, longer_alt: LIdentifier, categories: [InfixLevel] })
const Before = createToken({ name: "Before", pattern: /before/, longer_alt: LIdentifier, categories: [InfixLevel] })
const Boxed = createToken({ name: "Boxed", pattern: /boxed/, longer_alt: LIdentifier, categories: [Shape] })
const Case = createToken({ name: "Case", pattern: /case/, longer_alt: LIdentifier })
const Do = createToken({ name: "Do", pattern: /do/, longer_alt: LIdentifier })
const Elif = createToken({ name: "Elif", pattern: /elif/, longer_alt: LIdentifier })
const Else = createToken({ name: "Else", pattern: /else/, longer_alt: LIdentifier })
const Esac = createToken({ name: "Esac", pattern: /esac/, longer_alt: LIdentifier })
const Eta = createToken({ name: "Eta", pattern: /eta/, longer_alt: LIdentifier })
const False = createToken({ name: "False", pattern: /false/, longer_alt: LIdentifier, categories: [BooleanLiteral] })
const Fi = createToken({ name: "Fi", pattern: /fi/, longer_alt: LIdentifier })
const For = createToken({ name: "For", pattern: /for/, longer_alt: LIdentifier })
const Fun = createToken({ name: "Fun", pattern: /fun/, longer_alt: LIdentifier, categories: [Shape] })
const If = createToken({ name: "If", pattern: /if/, longer_alt: LIdentifier })
const Import = createToken({ name: "Import", pattern: /import/, longer_alt: LIdentifier })
const InfixL = createToken({ name: "InfixL", pattern: /infixl/, longer_alt: LIdentifier, categories: [InfixType] })
const InfixR = createToken({ name: "InfixR", pattern: /infixr/, longer_alt: LIdentifier, categories: [InfixType] })
const Infix = createToken({ name: "Infix", pattern: /infix/, longer_alt: LIdentifier, categories: [InfixType] })
const Lazy = createToken({ name: "Lazy", pattern: /lazy/, longer_alt: LIdentifier })
const Length = createToken({ name: "Length", pattern: /length/, longer_alt: LIdentifier })
const Local = createToken({ name: "Local", pattern: /local/, longer_alt: LIdentifier })
const Od = createToken({ name: "Od", pattern: /od/, longer_alt: LIdentifier })
const Of = createToken({ name: "Of", pattern: /of/, longer_alt: LIdentifier })
const Public = createToken({ name: "Public", pattern: /public/, longer_alt: LIdentifier })
const Repeat = createToken({ name: "Repeat", pattern: /repeat/, longer_alt: LIdentifier })
const Return = createToken({ name: "Return", pattern: /return/, longer_alt: LIdentifier })
const Sexp = createToken({ name: "Sexp", pattern: /sexp/, longer_alt: LIdentifier, categories: [Shape] })
const Skip = createToken({ name: "Skip", pattern: /skip/, longer_alt: LIdentifier })
const String = createToken({ name: "String", pattern: /string/, longer_alt: LIdentifier, categories: [Shape] })
const Then = createToken({ name: "Then", pattern: /then/, longer_alt: LIdentifier })
const True = createToken({ name: "True", pattern: /true/, longer_alt: LIdentifier, categories: [BooleanLiteral] })
const Unboxed = createToken({ name: "Unboxed", pattern: /unboxed/, longer_alt: LIdentifier, categories: [Shape] })
const Until = createToken({ name: "Until", pattern: /until/, longer_alt: LIdentifier })
const When = createToken({ name: "When", pattern: /when/, longer_alt: LIdentifier })
const While = createToken({ name: "While", pattern: /while/, longer_alt: LIdentifier })

const LineComment = createToken({
  name: "LineComment",
  pattern: /--[^\r\n]*/,
  start_chars_hint: ['-'],
  group: "comments"
})

const BlockComment = createToken({
  name: "BlockComment",
  pattern: (text, startOffset) => {
    let level = 0, endOffset = startOffset
    do {
      if (text.startsWith('(*', endOffset)) {
        endOffset += 2
        level++
      } else if (level > 0 && text.startsWith('*)', endOffset)) {
        endOffset += 2
        level--
      } else if (level > 0) {
        endOffset++
      }
    } while (level > 0 && endOffset + 1 < text.length)
    return startOffset == endOffset ? null : [text.substring(startOffset, endOffset)]
  },
  start_chars_hint: ["("],
  line_breaks: true,
  group: "comments"
})

const Whitespace = createToken({
  name: 'Whitespace',
  pattern: /[ \t\r\n]+/,
  start_chars_hint: [' ', '\t', '\r', '\n'],
  line_breaks: true,
  group: Lexer.SKIPPED
})

export const vocabulary = [
  Whitespace,
  BlockComment,
  LineComment,
  // Keywords
  After,
  Array,
  At,
  Before,
  Boxed,
  Case,
  Do,
  Elif,
  Else,
  Esac,
  Eta,
  False,
  Fi,
  For,
  Fun,
  If,
  Import,
  InfixL,
  InfixR,
  Infix,
  Lazy,
  Length,
  Local,
  Od,
  Of,
  Public,
  Repeat,
  Return,
  Sexp,
  Skip,
  String,
  Then,
  True,
  Unboxed,
  Until,
  When,
  While,
  // Keyword types
  Shape,
  InfixType,
  InfixLevel,
  BooleanLiteral,
  // Punctuation
  Comma,
  Dot,
  LCurly,
  RCurly,
  LRound,
  RRound,
  LSquare,
  RSquare,
  Semicolon,
  Underscore,
  // Operators
  Arrow,
  AtSign,
  Bar,
  Colon,
  Equal,
  Hash,
  Minus,
  Operator,
  // Literals
  UIdentifier,
  LIdentifier,
  DecimalLiteral,
  StringLiteral,
  CharLiteral
]

export const lexer = new Lexer(vocabulary, {
  skipValidations: false, // true for production
  traceInitPerf: true, // false for production
  ensureOptimizations: true,
  positionTracking: "full"
})

export default {
  Whitespace,
  BlockComment,
  LineComment,
  // Keywords
  After,
  Array,
  At,
  Before,
  Boxed,
  Case,
  Do,
  Elif,
  Else,
  Esac,
  Eta,
  False,
  Fi,
  For,
  Fun,
  If,
  Import,
  InfixL,
  InfixR,
  Infix,
  Lazy,
  Length,
  Local,
  Od,
  Of,
  Public,
  Repeat,
  Return,
  Sexp,
  Skip,
  String,
  Then,
  True,
  Unboxed,
  Until,
  When,
  While,
  // Keyword types
  Shape,
  InfixType,
  InfixLevel,
  BooleanLiteral,
  // Punctuation
  Comma,
  Dot,
  LCurly,
  RCurly,
  LRound,
  RRound,
  LSquare,
  RSquare,
  Semicolon,
  Underscore,
  // Operators
  Arrow,
  AtSign,
  Bar,
  Colon,
  Equal,
  Hash,
  Minus,
  Operator,
  // Literals
  UIdentifier,
  LIdentifier,
  DecimalLiteral,
  StringLiteral,
  CharLiteral
}
