import { TextDocument, Diagnostic, DiagnosticSeverity, IConnection, ClientCapabilities } from 'vscode-languageserver'
import { Settings, getDocumentSettings } from './settings'
import { Parser } from './parser'
import { Pool } from './pool'
import { connection, capabilities } from './connection'

const parsers = new Pool(Parser)

export async function validate (textDocument: TextDocument): Promise<void> {

  connection.console.log('PARSING')

  // In this simple example we get the settings for every validate run.
  const settings: Settings = await getDocumentSettings(textDocument.uri)

  const text = textDocument.getText()

  const diagnostics: Diagnostic[] = []

  const parser = parsers.get()
  parser.parse(text)

  if (parser.lexingResult?.errors && parser.lexingResult?.errors.length > 0) {
    const errors = parser.lexingResult?.errors
    console.log('Lexer errors:')
    console.log(JSON.stringify(errors, null, '\t'))
    errors.forEach((error, index) => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: textDocument.positionAt(error.offset),
          end: textDocument.positionAt(error.offset + error.length)
        },
        message: error.message,
        source: 'Lama Lexer'
      }
      if (capabilities.textDocument?.publishDiagnostics?.relatedInformation) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range)
            },
            message: error.message
          }
        ]
      }
      if (diagnostics.length < settings.maxNumberOfProblems) {
        diagnostics.push(diagnostic)
      }
    })
  }

  if (parser.errors.length > 0) {
    console.log('Parser errors:')
    console.log(JSON.stringify(parser.errors, null, '\t'))
    parser.errors.forEach((error, index) => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: textDocument.positionAt(error.token.startOffset),
          end: textDocument.positionAt((error.token.endOffset ?? error.token.startOffset) + 1)
        },
        message: error.message,
        source: 'Lama Parser'
      }
      if (capabilities.textDocument?.publishDiagnostics?.relatedInformation) {
        diagnostic.relatedInformation = [
          {
            location: {
              uri: textDocument.uri,
              range: Object.assign({}, diagnostic.range)
            },
            message: error.name
          }
        ]
      }
      if (diagnostics.length < settings.maxNumberOfProblems) {
        diagnostics.push(diagnostic)
      }
    })
  }

  parsers.release(parser)

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}
