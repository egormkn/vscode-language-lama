import { EmbeddedActionsParser, CstParser, CstElement, CstNode, IToken, ILexingError, ILexingResult } from 'chevrotain'
import Tokens, { vocabulary, lexer } from './lexer'
import { AbstractScope } from './scope'
import { Node, Data, Position, Point, Parent, Literal } from 'unist'
import * as node from 'unist-builder'
import { InterfaceItem } from './interface'

class Scope extends AbstractScope<InterfaceItem & Position> { }

function getStartPoint (token: IToken): Point {
  return {
    offset: token.startOffset,
    line: token.startLine ?? 0,
    column: token.startColumn ?? 0
  }
}

function getEndPoint (token: IToken): Point {
  return {
    offset: token.endOffset,
    line: token.endLine ?? 0,
    column: token.endColumn ?? 0
  }
}

function getPosition (...args: IToken[]): Position {
  const first = args[0]
  const last = args[args.length - 1]
  return {
    start: getStartPoint(first),
    end: getEndPoint(last)
  }
}

const debug = process.env.NODE_ENV === 'development'

export class Parser extends CstParser {

  public lexingResult?: ILexingResult

  public static reset (parser: Parser): void {
    parser.reset()
  }

  constructor () {
    super(vocabulary, {
      traceInitPerf: debug, // false for production
      skipValidations: !debug, // true for production
      recoveryEnabled: true,
      nodeLocationTracking: 'full'
    })
    this.performSelfAnalysis()
  }

  public parse (text: string): CstNode {
    this.lexingResult = lexer.tokenize(text)
    this.input = this.lexingResult.tokens
    return this.compilationUnit(0, [new Scope()])
  }

  private readonly compilationUnit = this.RULE('compilationUnit', (scope: Scope) => {
    this.MANY(() => {
      const importToken = this.CONSUME(Tokens.Import)
      const identifierToken = this.CONSUME(Tokens.UIdentifier)
      const semicolonToken = this.CONSUME(Tokens.Semicolon)
      this.ACTION(() => {
        const identifier = identifierToken.image
        scope.add(identifier, {
          type: 'I',
          identifier,
          start: getStartPoint(identifierToken),
          end: getEndPoint(identifierToken)
        })
      })
    })
    this.SUBRULE(this.scopeExpression, { ARGS: [new Scope(scope)] })
  }) 

  private readonly scopeExpression = this.RULE('scopeExpression', (scope: Scope) => {
    this.MANY(() => {
      this.SUBRULE(this.definition, { ARGS: [scope] })
    })
    this.OPTION(() => {
      this.SUBRULE(this.expression, { ARGS: [scope] })
    })
  })

  private readonly definition = this.RULE('definition', (scope: Scope) => {
    this.OR([
      {
        ALT: () => {
          this.SUBRULE(this.functionDefinition, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.infixDefinition, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.variableDefinition, { ARGS: [scope] })
        }
      }
    ])
  })

  private readonly functionDefinition = this.RULE('functionDefinition', (scope: Scope) => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Public)
    })
    this.CONSUME(Tokens.Fun)
    const identifierToken = this.CONSUME(Tokens.LIdentifier)
    this.CONSUME(Tokens.LRound)
    this.SUBRULE(this.functionArguments, { ARGS: [scope] })
    this.CONSUME(Tokens.RRound)
    this.ACTION(() => {
      const identifier = identifierToken.image
      scope.add(identifier, {
        type: 'F',
        identifier,
        start: getStartPoint(identifierToken),
        end: getEndPoint(identifierToken)
      })
    })
    this.SUBRULE(this.functionBody, { ARGS: [scope] })
  })

  private readonly functionArguments = this.RULE('functionArguments', (scope: Scope) => {
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.pattern, { ARGS: [scope] })
      }
    })
  })

  private readonly functionBody = this.RULE('functionBody', (scope: Scope) => {
    this.CONSUME(Tokens.LCurly)
    this.SUBRULE(this.scopeExpression, { ARGS: [new Scope(scope)] })
    this.CONSUME(Tokens.RCurly)
  })

  private readonly infixDefinition = this.RULE('infixDefinition', (scope: Scope) => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Public)
    })
    this.CONSUME(Tokens.Infixity)
    const operatorToken = this.CONSUME1(Tokens.Operator)
    this.CONSUME(Tokens.InfixLevel)
    this.CONSUME2(Tokens.Operator)
    this.CONSUME(Tokens.LRound)
    this.SUBRULE(this.functionArguments, { ARGS: [scope] })
    this.CONSUME(Tokens.RRound)
    this.ACTION(() => {
      const identifier = operatorToken.image
      scope.add(identifier, {
        type: 'F',
        identifier,
        start: getStartPoint(operatorToken),
        end: getEndPoint(operatorToken)
      })
    })
    this.SUBRULE(this.functionBody, { ARGS: [scope] })
  })

  private readonly variableDefinition = this.RULE('variableDefinition', (scope: Scope) => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.Local)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Public)
        }
      }
    ])
    this.AT_LEAST_ONE_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.variableDefinitionItem, { ARGS: [scope] })
      }
    })
    this.CONSUME(Tokens.Semicolon)
  })

  private readonly variableDefinitionItem = this.RULE('variableDefinitionItem', (scope: Scope) => {
    const identifierToken = this.CONSUME(Tokens.LIdentifier)
    this.ACTION(() => {
      const identifier = identifierToken.image
      scope.add(identifier, {
        type: 'V',
        identifier,
        start: getStartPoint(identifierToken),
        end: getEndPoint(identifierToken)
      })
    })
    this.OPTION(() => {
      this.CONSUME(Tokens.Equal)
      this.SUBRULE(this.basicExpression, { ARGS: [scope] })
    })
  })

  private readonly expression = this.RULE('expression', (scope: Scope) => {
    this.SUBRULE(this.basicExpression, { ARGS: [scope] })
    this.OPTION(() => {
      this.CONSUME(Tokens.Semicolon)
      this.SUBRULE(this.expression, { ARGS: [scope] })
    })
  })

  private readonly basicExpression = this.RULE('basicExpression', (scope: Scope) => { // FIXME, all above is correct
    this.SUBRULE1(this.postfixExpression, { ARGS: [scope] })
    this.MANY({
      GATE: () => !this.BACKTRACK(this.caseBranchPrefix).apply(this),
      DEF: () => {
        this.CONSUME(Tokens.Operator)
        this.SUBRULE2(this.postfixExpression, { ARGS: [scope] })
      }
    })
  })

  private readonly postfixExpression = this.RULE('postfixExpression', (scope: Scope) => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Minus)
    })
    this.SUBRULE(this.primary, { ARGS: [scope] })
    this.MANY(() => {
      this.SUBRULE(this.postfix, { ARGS: [scope] })
    })
  })

  private readonly primary = this.RULE('primary', (scope: Scope) => { // TODO: Apply
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.DecimalLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.StringLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.CharLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.BooleanLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Infix)
          this.CONSUME(Tokens.Operator)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Fun)
          this.CONSUME1(Tokens.LRound)
          this.SUBRULE(this.functionArguments, { ARGS: [scope] })
          this.CONSUME1(Tokens.RRound)
          this.SUBRULE(this.functionBody, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Skip)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Return)
          this.OPTION1(() => {
            this.SUBRULE(this.basicExpression, { ARGS: [scope] })
          })
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.LCurly)
          this.OR2([
            {
              GATE: () => this.BACKTRACK(this.listExpressionBody).apply(this),
              ALT: () => {
                this.SUBRULE(this.listExpressionBody, { ARGS: [scope] })
              }
            },
            {
              ALT: () => {
                this.SUBRULE(this.scopeExpression, { ARGS: [scope] })
              }
            }
          ])
          this.CONSUME(Tokens.RCurly)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.arrayExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.symbolExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.ifExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.whileExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.repeatExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.forExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.caseExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.lazyExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.etaExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.syntaxExpression, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.CONSUME2(Tokens.LRound)
          this.SUBRULE2(this.expression, { ARGS: [scope] })
          this.CONSUME2(Tokens.RRound)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.LIdentifier)
        }
      }
    ])
  })

  private readonly arrayExpression = this.RULE('arrayExpression', (scope: Scope) => {
    this.CONSUME(Tokens.LSquare)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.expression, { ARGS: [scope] })
      }
    })
    this.CONSUME(Tokens.RSquare)
  })

  private readonly listExpressionBody = this.RULE('listExpressionBody', (scope: Scope) => {
    this.SUBRULE1(this.expression, { ARGS: [scope] })
    this.CONSUME(Tokens.Comma)
    this.AT_LEAST_ONE_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE2(this.expression, { ARGS: [scope] })
      }
    })
  })

  private readonly symbolExpression = this.RULE('symbolExpression', (scope: Scope) => {
    this.CONSUME(Tokens.UIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.LRound)
      this.AT_LEAST_ONE_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          this.SUBRULE(this.expression, { ARGS: [scope] })
        }
      })
      this.CONSUME(Tokens.RRound)
    })
  })

  private readonly ifExpression = this.RULE('ifExpression', (scope: Scope) => {
    this.CONSUME(Tokens.If)
    this.SUBRULE(this.expression, { ARGS: [scope] })
    this.CONSUME(Tokens.Then)
    this.SUBRULE(this.scopeExpression, { ARGS: [new Scope(scope)] })
    this.OPTION(() => {
      this.SUBRULE(this.elsePart, { ARGS: [scope] })
    })
    this.CONSUME(Tokens.Fi)
  })

  private readonly elsePart = this.RULE('elsePart', (scope: Scope) => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.Elif)
          this.SUBRULE(this.expression, { ARGS: [scope] })
          this.CONSUME(Tokens.Then)
          this.SUBRULE1(this.scopeExpression, { ARGS: [new Scope(scope)] })
          this.OPTION(() => {
            this.SUBRULE(this.elsePart, { ARGS: [scope] })
          })
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Else)
          this.SUBRULE2(this.scopeExpression, { ARGS: [new Scope(scope)] })
        }
      }
    ])
  })

  private readonly whileExpression = this.RULE('whileExpression', (scope: Scope) => {
    this.CONSUME(Tokens.While)
    this.SUBRULE(this.expression, { ARGS: [scope] })
    this.CONSUME(Tokens.Do)
    this.SUBRULE(this.scopeExpression, { ARGS: [new Scope(scope)] })
    this.CONSUME(Tokens.Od)
  })

  private readonly repeatExpression = this.RULE('repeatExpression', (scope: Scope) => {
    this.CONSUME(Tokens.Repeat)
    this.SUBRULE(this.scopeExpression, { ARGS: [new Scope(scope)] })
    this.CONSUME(Tokens.Until)
    this.SUBRULE(this.basicExpression, { ARGS: [scope] })
  })

  private readonly forExpression = this.RULE('forExpression', (scope: Scope) => {
    this.CONSUME(Tokens.For)
    this.SUBRULE1(this.expression, { ARGS: [scope] })
    this.CONSUME1(Tokens.Comma)
    this.SUBRULE2(this.expression, { ARGS: [scope] })
    this.CONSUME2(Tokens.Comma)
    this.SUBRULE3(this.expression, { ARGS: [scope] })
    this.CONSUME(Tokens.Do)
    this.SUBRULE(this.scopeExpression, { ARGS: [new Scope(scope)] })
    this.CONSUME(Tokens.Od)
  })

  private readonly caseExpression = this.RULE('caseExpression', (scope: Scope) => {
    this.CONSUME(Tokens.Case)
    this.SUBRULE(this.expression, { ARGS: [scope] })
    this.CONSUME(Tokens.Of)
    this.SUBRULE(this.pattern, { ARGS: [scope] })
    this.CONSUME(Tokens.Arrow)
    this.SUBRULE1(this.scopeExpression, { ARGS: [new Scope(scope)] })
    this.MANY(() => {
      this.SUBRULE(this.caseBranchPrefix, { ARGS: [scope] })
      this.SUBRULE2(this.scopeExpression, { ARGS: [new Scope(scope)] })
    })
    this.CONSUME(Tokens.Esac)
  })

  private readonly caseBranchPrefix = this.RULE('caseBranchPrefix', (scope: Scope) => {
    this.CONSUME(Tokens.Bar)
    this.SUBRULE(this.pattern, { ARGS: [scope] })
    this.CONSUME(Tokens.Arrow)
  })

  private readonly lazyExpression = this.RULE('lazyExpression', (scope: Scope) => {
    this.CONSUME(Tokens.Lazy)
    this.SUBRULE(this.basicExpression, { ARGS: [scope] })
  })

  private readonly etaExpression = this.RULE('etaExpression', (scope: Scope) => {
    this.CONSUME(Tokens.Eta)
    this.SUBRULE(this.basicExpression, { ARGS: [scope] })
  })

  private readonly syntaxExpression = this.RULE('syntaxExpression', (scope: Scope) => {
    this.CONSUME(Tokens.Syntax)
    this.CONSUME(Tokens.LRound)
    this.AT_LEAST_ONE_SEP({
      SEP: Tokens.Bar,
      DEF: () => {
        this.SUBRULE(this.syntaxSeq, { ARGS: [scope] })
      }
    })
    this.CONSUME(Tokens.RRound)
  })

  private readonly syntaxSeq = this.RULE('syntaxSeq', (scope: Scope) => {
    this.AT_LEAST_ONE({
      DEF: () => {
        this.SUBRULE(this.syntaxBinding, { ARGS: [scope] })
      }
    })
    this.OPTION(() => {
      this.CONSUME(Tokens.LCurly)
      this.SUBRULE(this.expression, { ARGS: [scope] })
      this.CONSUME(Tokens.RCurly)
    })
  })

  private readonly syntaxBinding = this.RULE('syntaxBinding', (scope: Scope) => {
    this.OPTION1(() => {
      this.CONSUME(Tokens.Minus)
    })
    this.OPTION2(() => {
      this.SUBRULE(this.pattern, { ARGS: [scope] })
      this.CONSUME(Tokens.Equal)
    })
    this.SUBRULE(this.syntaxPostfix, { ARGS: [scope] })
  })

  private readonly syntaxPostfix = this.RULE('syntaxPostfix', (scope: Scope) => {
    this.SUBRULE(this.syntaxPrimary, { ARGS: [scope] })
    this.OPTION(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Tokens.Plus)
          }
        },
        {
          ALT: () => {
            this.CONSUME(Tokens.Question)
          }
        },
        {
          ALT: () => {
            this.CONSUME(Tokens.Star)
          }
        }
      ])
    })
  })

  private readonly syntaxPrimary = this.RULE('syntaxPrimary', (scope: Scope) => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.LIdentifier)
          this.MANY(() => {
            this.CONSUME(Tokens.LSquare)
            this.AT_LEAST_ONE_SEP({
              SEP: Tokens.Comma,
              DEF: () => {
                this.SUBRULE1(this.expression, { ARGS: [scope] })
              }
            })
            this.CONSUME(Tokens.RSquare)
          })
        }
      },
      {
        ALT: () => {
          this.CONSUME1(Tokens.LRound)
          this.SUBRULE(this.syntaxExpression, { ARGS: [scope] })
          this.CONSUME1(Tokens.RRound)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Dollar)
          this.CONSUME2(Tokens.LRound)
          this.SUBRULE2(this.expression, { ARGS: [scope] })
          this.CONSUME2(Tokens.RRound)
        }
      }
    ])
  })

  private readonly postfix = this.RULE('postfix', (scope: Scope) => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME1(Tokens.Dot)
          this.CONSUME(Tokens.Length)
        }
      },
      {
        ALT: () => {
          this.CONSUME2(Tokens.Dot)
          this.CONSUME(Tokens.String)
        }
      },
      {
        ALT: () => {
          this.SUBRULE1(this.postfixCall, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.postfixIndex, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.CONSUME3(Tokens.Dot)
          this.CONSUME(Tokens.LIdentifier)
          this.OPTION(() => {
            this.SUBRULE2(this.postfixCall, { ARGS: [scope] })
          })
        }
      }
    ])
  })

  private readonly postfixCall = this.RULE('postfixCall', (scope: Scope) => {
    this.CONSUME(Tokens.LRound)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.expression, { ARGS: [scope] })
      }
    })
    this.CONSUME(Tokens.RRound)
  })

  private readonly postfixIndex = this.RULE('postfixIndex', (scope: Scope) => {
    this.CONSUME(Tokens.LSquare)
    this.SUBRULE(this.expression, { ARGS: [scope] })
    this.CONSUME(Tokens.RSquare)
  })

  /// PATTERNS

  private readonly pattern = this.RULE('pattern', (scope: Scope) => {
    this.SUBRULE(this.simplePattern, { ARGS: [scope] })
    this.OPTION(() => {
      this.CONSUME(Tokens.Colon)
      this.SUBRULE(this.pattern, { ARGS: [scope] })
    })
  })

  private readonly simplePattern = this.RULE('simplePattern', (scope: Scope) => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.Underscore)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.sExprPattern, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.arrayPattern, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.listPattern, { ARGS: [scope] })
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.DecimalLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.StringLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.CharLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.BooleanLiteral)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Hash)
          this.CONSUME(Tokens.Shape)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.LRound)
          this.SUBRULE(this.pattern, { ARGS: [scope] })
          this.CONSUME(Tokens.RRound)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.asPattern, { ARGS: [scope] })
        }
      }
    ])
  })

  private readonly sExprPattern = this.RULE('sExprPattern', (scope: Scope) => {
    this.CONSUME(Tokens.UIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.LRound)
      this.AT_LEAST_ONE_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          this.SUBRULE(this.pattern, { ARGS: [scope] })
        }
      })
      this.CONSUME(Tokens.RRound)
    })
  })

  private readonly arrayPattern = this.RULE('arrayPattern', (scope: Scope) => {
    this.CONSUME(Tokens.LSquare)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.pattern, { ARGS: [scope] })
      }
    })
    this.CONSUME(Tokens.RSquare)
  })

  private readonly listPattern = this.RULE('listPattern', (scope: Scope) => {
    this.CONSUME(Tokens.LCurly)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.pattern, { ARGS: [scope] })
      }
    })
    this.CONSUME(Tokens.RCurly)
  })

  private readonly asPattern = this.RULE('asPattern', (scope: Scope) => {
    this.CONSUME(Tokens.LIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.AtSign)
      this.SUBRULE(this.pattern, { ARGS: [scope] })
    })
  })
}
