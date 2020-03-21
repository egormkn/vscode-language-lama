/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { CstParser, CstNode, IToken } from 'chevrotain'
import Tokens, { vocabulary } from './lexer'

class Parser extends CstParser {

  constructor () {
    super(vocabulary, {
      traceInitPerf: true,
      recoveryEnabled: true
    })
    this.performSelfAnalysis()
  }

  public parse = this.RULE("parse", () => {
    this.MANY(() => {
      this.CONSUME(Tokens.Import)
      this.CONSUME(Tokens.UIdentifier)
      this.CONSUME(Tokens.Semicolon)
    })
    this.SUBRULE(this.scopeExpression)
  })

  private scopeExpression = this.RULE("scopeExpression", inCase => {
    this.MANY(() => {
      this.SUBRULE(this.definition)
    })
    this.OPTION(() => {
      this.SUBRULE(this.expression, { ARGS: [inCase] })
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
    this.CONSUME(Tokens.LParent)
    this.SUBRULE(this.functionArguments)
    this.CONSUME(Tokens.RParent)
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
    this.CONSUME(Tokens.InfixAny)
    this.CONSUME1(Tokens.Operator)
    this.CONSUME(Tokens.InfixLevel)
    this.CONSUME2(Tokens.Operator)
    this.CONSUME(Tokens.LParent)
    this.SUBRULE(this.functionArguments)
    this.CONSUME(Tokens.RParent)
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

  private expression = this.RULE("expression", inCase => {
    this.OPTION(() => {
      this.SUBRULE(this.basicExpression)
      this.CONSUME(Tokens.Semicolon)
    })
    this.SUBRULE(this.basicExpression, { ARGS: [inCase] })
  })

  private basicExpression = this.RULE("basicExpression", inCase => {
    this.AT_LEAST_ONE_SEP({
      SEP: Tokens.Operator, // FIXME: Use operator priority
      DEF: () => {
        this.OPTION(() => {
          this.CONSUME(Tokens.Minus)
        })
        this.SUBRULE(this.postfixExpression)
      }
    })
    this.OPTION(() => {
      this.CONSUME(Tokens.Minus)
    })
    this.SUBRULE(this.postfixExpression, { ARGS: [inCase] })
  })

  private basicExpressionNoBar = this.RULE("basicExpressionNoBar", inCase => {
    this.AT_LEAST_ONE_SEP({
      SEP: Tokens.Operator, // FIXME: Use operator priority
      DEF: () => {
        this.SUBRULE(this.minusPostfixExpression)
      }
    })
    this.CONSUME(Tokens.NotBarOperator)
    this.SUBRULE(this.minusPostfixExpression, { ARGS: [inCase] })
  })

  private minusPostfixExpression = this.RULE("minusPostfixExpression", inCase => {
    this.OPTION(() => {
      this.CONSUME(Tokens.Minus)
    })
    this.SUBRULE(this.postfixExpression, { ARGS: [inCase] })
  })

  private postfixExpression = this.RULE("postfixExpression", inCase => {
    this.SUBRULE(this.primary, { ARGS: [inCase] })
    this.MANY(() => {
      this.SUBRULE(this.postfix)
    })
  })

  private primary = this.RULE("primary", inCase => { // TODO: Apply
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
          this.CONSUME(Tokens.True)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.False)
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
          this.CONSUME1(Tokens.LParent)
          this.SUBRULE(this.functionArguments)
          this.CONSUME1(Tokens.RParent)
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
          this.CONSUME(Tokens.RCurly)
          this.AT_LEAST_ONE(() => {
            this.SUBRULE(this.definition)
          })
          this.OPTION2(() => {
            this.SUBRULE1(this.expression)
          })
          this.CONSUME(Tokens.LCurly)
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
          this.CONSUME2(Tokens.LParent)
          this.SUBRULE2(this.expression)
          this.CONSUME2(Tokens.RParent)
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
      this.CONSUME(Tokens.LParent)
      this.AT_LEAST_ONE_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          this.SUBRULE(this.expression)
        }
      })
      this.CONSUME(Tokens.RParent)
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
    this.AT_LEAST_ONE_SEP({
      SEP: Tokens.Bar,
      DEF: () => { 
        this.SUBRULE(this.pattern)
        this.CONSUME(Tokens.Arrow)
        this.SUBRULE(this.scopeExpression, { ARGS: [true] })
      }
    })
    this.CONSUME(Tokens.Esac)
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
    this.CONSUME(Tokens.LParent)
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => {
        this.SUBRULE(this.expression)
      }
    })
    this.CONSUME(Tokens.RParent)
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
          this.CONSUME(Tokens.Wildcard)
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
          this.CONSUME(Tokens.True)
        }
      },
      {
        ALT: () => {
          this.CONSUME(Tokens.False)
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
          this.CONSUME(Tokens.LParent)
          this.SUBRULE(this.pattern)
          this.CONSUME(Tokens.RParent)
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
      this.CONSUME(Tokens.LParent)
      this.AT_LEAST_ONE_SEP({
        SEP: Tokens.Comma,
        DEF: () => {
          this.SUBRULE(this.pattern)
        }
      })
      this.CONSUME(Tokens.RParent)
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

export const parser = new Parser()
