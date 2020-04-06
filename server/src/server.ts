import {
  DidChangeConfigurationNotification,
  TextDocuments
} from 'vscode-languageserver'

import { TextDocument } from 'vscode-languageserver-textdocument'

import { capabilities, connection } from './connection'
import { documentSettings, resetSettings } from './settings'
import { validate } from './validator'

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

connection.onInitialized(() => {
  if (capabilities.workspace?.configuration) {
    connection.client.register(DidChangeConfigurationNotification.type, {
      section: 'lama'
    })
  }
  if (capabilities.workspace?.workspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders(() => {
      connection.console.log('Workspace folder change event received')
    })
  }
})

// //////////////////////////////////////////////////////////////////////////

documents.onDidOpen(event => {
  connection.console.log(`TextDocument opened: ${event.document.uri}`)
})

documents.onDidClose(event => {
  connection.console.log(`TextDocument closed: ${event.document.uri}`)
  // Only keep settings for open documents
  documentSettings.delete(event.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(event => {
  console.log(`TextDocument content changed: ${event.document.uri}`)
  validate(event.document)
})

documents.onDidSave(event => {
  connection.console.log(`TextDocument saved: ${event.document.uri}`)
})

documents.onWillSave(event => {
  connection.console.log(`TextDocument will be saved: ${event.document.uri}`)
})

// ///////////////////////////////////////////////////////////////////////////

/**
 * A text document got opened in VSCode
 * @param params.textDocument.uri uniquely identifies the document
 *        For documents store on disk this is a file URI
 * @param params.textDocument.version document version
 * @param params.textDocument.text the initial full content of the document
 * @param params.textDocument.languageId document language
 */
connection.onDidOpenTextDocument(params => {
  connection.console.log(`Document ${params.textDocument.uri} opened`)
})

/**
 * The content of a text document did change in VSCode
 * @param params.textDocument.uri uniquely identifies the document
 * @param params.textDocument.version document version
 * @param params.contentChanges describe the content changes to the document
 */
connection.onDidChangeTextDocument(params => {
  connection.console.log(`Document ${params.textDocument.uri} changed`)
  connection.console.log(JSON.stringify(params.contentChanges))
})

/**
 * A text document was saved in VSCode
 * @param params.textDocument.uri uniquely identifies the document
 *        For documents store on disk this is a file URI
 * @param params.textDocument.version document version
 * @param params.text the saved content of the document
 */
connection.onDidSaveTextDocument(params => {
  connection.console.log(`Document ${params.textDocument.uri} saved`)
})

/**
 * A text document got closed in VSCode
 * @param params.textDocument.uri uniquely identifies the document
 */
connection.onDidCloseTextDocument(params => {
  connection.console.log(`Document ${params.textDocument.uri} closed`)
})

/**
 * Watched files were changed in workspace
 * @param params.changes array of FileEvents
 */
connection.onDidChangeWatchedFiles(params => {
  connection.console.log('Watched files changed:')
  connection.console.log(params.changes.map(event => `${event.uri} (${event.type})`).join('\n'))
})

connection.onDidChangeConfiguration(params => {
  connection.console.log(`Configuration changed: ${JSON.stringify(params.settings)}`)
  resetSettings(params.settings.lama)
  Promise.all(documents.all().map(validate))
})

documents.listen(connection)

connection.listen()
