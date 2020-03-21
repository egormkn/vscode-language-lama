import { createToken, Lexer } from 'chevrotain'

const UIdentifier = createToken({ name: "UIdentifier", pattern: /[A-Z][a-zA-Z_0-9]*/ })
const LIdentifier = createToken({ name: "LIdentifier", pattern: /[a-z][a-zA-Z_0-9]*/ })
const DecimalLiteral = createToken({ name: "DecimalLiteral", pattern: /[0-9]+/ })
const StringLiteral = createToken({ name: "StringLiteral", pattern: /"([^"]|"")*"/ })
const CharLiteral = createToken({ name: "CharLiteral", pattern: /'([^']|''|\\n|\\t)'/ })

const Operator = createToken({ name: "Operator", pattern: Lexer.NA })
const NotBarOperator = createToken({ name: "NotBarOperator", pattern: Lexer.NA })

const BinaryOperator = createToken({ name: "BinaryOperator", pattern: /[+*/%$#@!|&^~?<>:=-]+/, categories: [Operator, NotBarOperator] })
const Arrow = createToken({ name: "Arrow", label: "->", pattern: /->/, longer_alt: BinaryOperator, categories: [Operator, NotBarOperator] })
const Hash = createToken({ name: "Hash", label: "#", pattern: /#/, longer_alt: BinaryOperator, categories: [Operator, NotBarOperator] })
const AtSign = createToken({ name: "AtSign", label: "@", pattern: /@/, longer_alt: BinaryOperator, categories: [Operator, NotBarOperator] })
const Bar = createToken({ name: "Bar", label: "|", pattern: /\|/, longer_alt: BinaryOperator, categories: [Operator] })
const Minus = createToken({ name: "Minus", label: "-", pattern: /-/, longer_alt: Arrow, categories: [Operator, NotBarOperator] })
const Equal = createToken({ name: "Equal", label: "=", pattern: /=/, longer_alt: BinaryOperator, categories: [Operator, NotBarOperator] })
const Colon = createToken({ name: "Colon", label: ":", pattern: /:/, longer_alt: BinaryOperator, categories: [Operator, NotBarOperator] })
const Wildcard = createToken({ name: "Wildcard", label: "_", pattern: /_/ })

const Shape = createToken({ name: "Shape", pattern: Lexer.NA })
const InfixAny = createToken({ name: "InfixAny", pattern: Lexer.NA })
const InfixLevel = createToken({ name: "InfixLevel", pattern: Lexer.NA })

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
const False = createToken({ name: "False", pattern: /false/, longer_alt: LIdentifier })
const Fi = createToken({ name: "Fi", pattern: /fi/, longer_alt: LIdentifier })
const For = createToken({ name: "For", pattern: /for/, longer_alt: LIdentifier })
const Fun = createToken({ name: "Fun", pattern: /fun/, longer_alt: LIdentifier, categories: [Shape] })
const If = createToken({ name: "If", pattern: /if/, longer_alt: LIdentifier })
const Import = createToken({ name: "Import", pattern: /import/, longer_alt: LIdentifier })
const InfixL = createToken({ name: "InfixL", pattern: /infixl/, longer_alt: LIdentifier, categories: [InfixAny] })
const InfixR = createToken({ name: "InfixR", pattern: /infixr/, longer_alt: LIdentifier, categories: [InfixAny] })
const Infix = createToken({ name: "Infix", pattern: /infix/, longer_alt: LIdentifier, categories: [InfixAny] })
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
const True = createToken({ name: "True", pattern: /true/, longer_alt: LIdentifier })
const Unboxed = createToken({ name: "Unboxed", pattern: /unboxed/, longer_alt: LIdentifier, categories: [Shape] })
const Until = createToken({ name: "Until", pattern: /until/, longer_alt: LIdentifier })
const When = createToken({ name: "When", pattern: /when/, longer_alt: LIdentifier })
const While = createToken({ name: "While", pattern: /while/, longer_alt: LIdentifier })

const Dot = createToken({ name: "Dot", label: ".", pattern: /\./ })
const Comma = createToken({ name: "Comma", label: ",", pattern: /,/ })
const LParent = createToken({ name: "LParent", label: "(", pattern: /\(/ })
const RParent = createToken({ name: "RParent", label: ")", pattern: /\)/ })
const LCurly = createToken({ name: "LCurly", label: '{', pattern: /{/ })
const RCurly = createToken({ name: "RCurly", label: "}", pattern: /}/ })
const LSquare = createToken({ name: "LSquare", label: "[", pattern: /\[/ })
const RSquare = createToken({ name: "RSquare", label: "]", pattern: /\]/ })
const Semicolon = createToken({ name: "Semicolon", label: ";", pattern: /;/ })

const LineComment = createToken({
  name: "LineComment",
  pattern: /--.*/,
  start_chars_hint: ['-'],
  group: "comments"
})

const BlockComment = createToken({
  name: "BlockComment",
  pattern: (text, startOffset) => {
    let endOffset = startOffset
    let level = 0
    do {
      if (text.charAt(endOffset) == '(' && text.charAt(endOffset + 1) == '*') {
        endOffset += 2
        level++
      } else if (text.charAt(endOffset) == '*' && text.charAt(endOffset + 1) == ')') {
        endOffset += 2
        level--
      } else if (level > 0){
        endOffset++
      }
    } while (level !== 0 && endOffset + 1 < text.length);

    if (level > 0) {
      return [text.substring(startOffset)]
    } else if (endOffset === startOffset) {
      return null
    } else {
      return [text.substring(startOffset, endOffset)]
    }
  },
  start_chars_hint: ["("],
  line_breaks: true,
  group: "comments"
})

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \n\r\t]+/,
  start_chars_hint: [' ', '\n', '\r', '\t'],
  line_breaks: true,
  group: Lexer.SKIPPED
})

export const vocabulary = [
  WhiteSpace,
  BlockComment,
  LineComment,
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
  UIdentifier,
  LIdentifier,
  DecimalLiteral,
  StringLiteral,
  CharLiteral,
  Arrow,
  Hash,
  AtSign,
  Bar,
  Minus,
  Equal,
  BinaryOperator,
  Wildcard,
  Dot,
  Comma,
  LParent,
  RParent,
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Semicolon,
  Operator,
  NotBarOperator,
  Shape,
  InfixAny,
  InfixLevel
]

export const lexer = new Lexer(vocabulary, {
  traceInitPerf: true
})

export default {
  WhiteSpace,
  BlockComment,
  LineComment,
  Shape,
  InfixLevel,
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
  InfixAny,
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
  UIdentifier,
  LIdentifier,
  DecimalLiteral,
  StringLiteral,
  CharLiteral,
  Arrow,
  Hash,
  AtSign,
  Bar,
  Minus,
  Equal,
  Colon,
  BinaryOperator,
  Wildcard,
  Operator,
  NotBarOperator,
  Dot,
  Comma,
  LParent,
  RParent,
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Semicolon
};