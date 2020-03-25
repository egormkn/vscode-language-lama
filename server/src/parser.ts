/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { EmbeddedActionsParser, CstParser, CstElement, CstNode, IToken } from 'chevrotain'
import Tokens, { vocabulary } from './lexer'
import { Environment } from './environment'
import { Node as AstNode, Data, Position, Point, Parent, Literal } from 'unist'

export class Parser extends CstParser {

  constructor () {
    super(vocabulary, {
      traceInitPerf: true, // false for production
      skipValidations: false, // true for production
      recoveryEnabled: true,
      nodeLocationTracking: "full"
    })
    this.performSelfAnalysis()
  }

  public parse (env: Environment, tokens: IToken[]): CstNode {
    this.input = tokens
    return this.unit(0, [env])
  }

  private unit = this.RULE("unit", () => {
    this.MANY(() => {
      this.CONSUME(Tokens.Import)
      this.CONSUME(Tokens.UIdentifier)
      this.CONSUME(Tokens.Semicolon)
    })
    this.SUBRULE(this.scopeExpression)
  })

  private scopeExpression = this.RULE("scopeExpression", () => {
    this.MANY(() => {
      this.SUBRULE(this.definition)
    })
    this.OPTION(() => {
      this.SUBRULE(this.expression)
    })
  })

  private definition = this.RULE("definition", () => {
    this.OR([
      {
        ALT: () => {
          this.SUBRULE(this.functionDefinition)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.infixDefinition)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.variableDefinition)
        }
      }
    ])
  })

  private functionDefinition = this.RULE("functionDefinition", () => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Public)
    })
    this.CONSUME(Tokens.Fun)
    this.CONSUME(Tokens.LIdentifier)
    this.CONSUME(Tokens.LRound)
    this.SUBRULE(this.functionArguments)
    this.CONSUME(Tokens.RRound)
    this.SUBRULE(this.functionBody)
  })

  private functionArguments = this.RULE("functionArguments", () => {
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.pattern)
      }
    })
  })

  private functionBody = this.RULE("functionBody", () => {
    this.CONSUME(Tokens.LCurly)
    this.SUBRULE(this.scopeExpression)
    this.CONSUME(Tokens.RCurly)
  })

  private infixDefinition = this.RULE("infixDefinition", () => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Public)
    })
    this.CONSUME(Tokens.InfixType)
    this.CONSUME1(Tokens.Operator)
    this.CONSUME(Tokens.InfixLevel)
    this.CONSUME2(Tokens.Operator)
    this.CONSUME(Tokens.LRound)
    this.SUBRULE(this.functionArguments)
    this.CONSUME(Tokens.RRound)
    this.SUBRULE(this.functionBody)
  })

  private variableDefinition = this.RULE("variableDefinition", () => {
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
        this.SUBRULE(this.variableDefinitionItem)
      }
    })
    this.CONSUME(Tokens.Semicolon)
  })

  private variableDefinitionItem = this.RULE("variableDefinitionItem", () => {
    this.CONSUME(Tokens.LIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.Equal)
      this.SUBRULE(this.basicExpression)
    })
  })

  private expression = this.RULE("expression", () => {
    this.SUBRULE(this.basicExpression)
    this.OPTION(() => {
      this.CONSUME(Tokens.Semicolon)
      this.SUBRULE(this.expression)
    })
  })

  private basicExpression = this.RULE("basicExpression", () => {
    this.SUBRULE1(this.postfixExpression)
    this.MANY({
      GATE: () => !this.BACKTRACK(this.caseBranchPrefix).apply(this),
      DEF: () => {
        this.CONSUME(Tokens.Operator)
        this.SUBRULE2(this.postfixExpression)
      }
    })
  })

  private postfixExpression = this.RULE("postfixExpression", () => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Minus)
    })
    this.SUBRULE(this.primary)
    this.MANY(() => {
      this.SUBRULE(this.postfix)
    })
  })

  private primary = this.RULE("primary", () => { // TODO: Apply
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
          this.SUBRULE(this.functionArguments)
          this.CONSUME1(Tokens.RRound)
          this.SUBRULE(this.functionBody)
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
            this.SUBRULE(this.basicExpression)
          })
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.LCurly)
          this.AT_LEAST_ONE(() => {
            this.SUBRULE(this.definition)
          })
          this.OPTION2(() => {
            this.SUBRULE1(this.expression)
          })
          this.CONSUME(Tokens.RCurly)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.listOrScopeExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.arrayExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.symbolExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.ifExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.whileExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.repeatExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.forExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.caseExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.lazyExpression)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.etaExpression)
        }
      },
      {
        ALT: () => {
          this.CONSUME2(Tokens.LRound)
          this.SUBRULE2(this.expression)
          this.CONSUME2(Tokens.RRound)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.LIdentifier)
        }
      },
    ])
  })

  private arrayExpression = this.RULE("arrayExpression", () => {
    this.CONSUME(Tokens.LSquare)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.expression)
      }
    })
    this.CONSUME(Tokens.RSquare)
  })

  private listOrScopeExpression = this.RULE("listOrScopeExpression", () => {
    this.CONSUME(Tokens.LCurly)
    this.OPTION1(() => {
      this.SUBRULE1(this.expression)
      this.OPTION2(() => {
        this.CONSUME(Tokens.Comma)
        this.AT_LEAST_ONE_SEP({
          SEP: Tokens.Comma,
          DEF: () => {
            this.SUBRULE(this.expression)
          }
        })
      })
    })
    this.CONSUME(Tokens.RCurly)
  })

  private symbolExpression = this.RULE("symbolExpression", () => {
    this.CONSUME(Tokens.UIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.LRound)
      this.AT_LEAST_ONE_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          this.SUBRULE(this.expression)
        }
      })
      this.CONSUME(Tokens.RRound)
    })
  })

  private ifExpression = this.RULE("ifExpression", () => {
    this.CONSUME(Tokens.If)
    this.SUBRULE(this.expression)
    this.CONSUME(Tokens.Then)
    this.SUBRULE(this.scopeExpression)
    this.OPTION(() => {
      this.SUBRULE(this.elsePart)
    })
    this.CONSUME(Tokens.Fi)
  })

  private elsePart = this.RULE("elsePart", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.Elif)
          this.SUBRULE(this.expression)
          this.CONSUME(Tokens.Then)
          this.SUBRULE1(this.scopeExpression)
          this.OPTION(() => {
            this.SUBRULE(this.elsePart)
          })
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.Else)
          this.SUBRULE2(this.scopeExpression)
        }
      }
    ])
  })

  private whileExpression = this.RULE("whileExpression", () => {
    this.CONSUME(Tokens.While)
    this.SUBRULE(this.expression)
    this.CONSUME(Tokens.Do)
    this.SUBRULE(this.scopeExpression)
    this.CONSUME(Tokens.Od)
  })

  private repeatExpression = this.RULE("repeatExpression", () => {
    this.CONSUME(Tokens.Repeat)
    this.SUBRULE(this.scopeExpression)
    this.CONSUME(Tokens.Until)
    this.SUBRULE(this.basicExpression)
  })

  private forExpression = this.RULE("forExpression", () => {
    this.CONSUME(Tokens.For)
    this.SUBRULE1(this.expression)
    this.CONSUME1(Tokens.Comma)
    this.SUBRULE2(this.expression)
    this.CONSUME2(Tokens.Comma)
    this.SUBRULE3(this.expression)
    this.CONSUME(Tokens.Do)
    this.SUBRULE(this.scopeExpression)
    this.CONSUME(Tokens.Od)
  })

  private caseExpression = this.RULE("caseExpression", () => {
    this.CONSUME(Tokens.Case)
    this.SUBRULE(this.expression)
    this.CONSUME(Tokens.Of)
    this.SUBRULE(this.pattern)
    this.CONSUME(Tokens.Arrow)
    this.SUBRULE1(this.scopeExpression)
    this.MANY(() => {
      this.SUBRULE(this.caseBranchPrefix)
      this.SUBRULE2(this.scopeExpression)
    })
    this.CONSUME(Tokens.Esac)
  })

  private caseBranchPrefix = this.RULE("caseBranchPrefix", () => {
    this.CONSUME(Tokens.Bar)
    this.SUBRULE(this.pattern)
    this.CONSUME(Tokens.Arrow)
  })

  private lazyExpression = this.RULE("lazyExpression", () => {
    this.CONSUME(Tokens.Lazy)
    this.SUBRULE(this.basicExpression)
  })

  private etaExpression = this.RULE("etaExpression", () => {
    this.CONSUME(Tokens.Eta)
    this.SUBRULE(this.basicExpression)
  })

  private postfix = this.RULE("postfix", () => {
    this.OR([
      {
        ALT: () => {
          this.SUBRULE1(this.postfixCall)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.postfixIndex)
        }
      },
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
          this.CONSUME3(Tokens.Dot)
          this.CONSUME(Tokens.LIdentifier)
          this.OPTION(() => {
            this.SUBRULE2(this.postfixCall)
          })
        }
      }
    ])
  })

  private postfixCall = this.RULE("postfixCall", () => {
    this.CONSUME(Tokens.LRound)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.expression)
      }
    })
    this.CONSUME(Tokens.RRound)
  })

  private postfixIndex = this.RULE("postfixIndex", () => {
    this.CONSUME(Tokens.LSquare)
    this.SUBRULE(this.expression)
    this.CONSUME(Tokens.RSquare)
  })

  /// PATTERNS

  private pattern = this.RULE("pattern", () => {
    this.SUBRULE(this.simplePattern)
    this.OPTION(() => {
      this.CONSUME(Tokens.Colon)
      this.SUBRULE(this.pattern)
    })
  })

  private simplePattern = this.RULE("simplePattern", () => {
    this.OR([
      {
        ALT: () => {
          this.CONSUME(Tokens.Underscore)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.sExprPattern)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.arrayPattern)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.listPattern)
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
          this.SUBRULE(this.pattern)
          this.CONSUME(Tokens.RRound)
        }
      },
      {
        ALT: () => {
          this.SUBRULE(this.asPattern)
        }
      },
    ])
  })

  private sExprPattern = this.RULE("sExprPattern", () => {
    this.CONSUME(Tokens.UIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.LRound)
      this.AT_LEAST_ONE_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          this.SUBRULE(this.pattern)
        }
      })
      this.CONSUME(Tokens.RRound)
    })
  })

  private arrayPattern = this.RULE("arrayPattern", () => {
    this.CONSUME(Tokens.LSquare)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.pattern)
      }
    })
    this.CONSUME(Tokens.RSquare)
  })

  private listPattern = this.RULE("listPattern", () => {
    this.CONSUME(Tokens.LCurly)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.pattern)
      }
    })
    this.CONSUME(Tokens.RCurly)
  })

  private asPattern = this.RULE("asPattern", () => {
    this.CONSUME(Tokens.LIdentifier)
    this.OPTION(() => {
      this.CONSUME(Tokens.AtSign)
      this.SUBRULE(this.pattern)
    })
  })

}
