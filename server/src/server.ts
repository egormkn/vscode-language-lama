import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  ClientCapabilities,
  TextDocumentSyncKind,
  TextDocumentChangeEvent,
  DidChangeWatchedFilesParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
  DidChangeConfigurationParams,
  IConnection
} from 'vscode-languageserver'

import { TextDocument } from 'vscode-languageserver-textdocument'

import { validate } from './validator'
import { Parser } from './parser'
import { Pool } from './pool'
import { Settings, globalSettings, documentSettings } from './settings'
import { connection, client, capabilities, workspace } from './connection'

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)
documents.listen(connection)

connection.onInitialized(() => {
  if (capabilities.workspace?.configuration) {
    connection.client.register(DidChangeConfigurationNotification.type, {
      section: 'lama'
    })
  }
  if (capabilities.workspace?.workspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders(event => {
      connection.console.log('Workspace folder change event received')
    })
  }
})

// //////////////////////////////////////////////////////////////////////////

// Only keep settings for open documents
documents.onDidClose(event => {
  connection.console.log(`TextDocument closed: ${event.document.uri}`)
  documentSettings.delete(event.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(event => {
  console.log(`TextDocument content changed: ${event.document.uri}`)
  validate(event.document)
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
  const document = documents.get(params.textDocument.uri)
  if (document) {
    validate(document)
  } else {
    connection.console.log('NO DOCUMENT')
  }
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

  // if (capabilities.workspace?.configuration) {
  //   documentSettings.clear() // Reset all cached document settings
  // } else {
  //   globalSettings = (params.settings.lama || defaultSettings) as Settings
  // }

  // documents.all().forEach(validateTextDocument) // Revalidate all open text documents
})

connection.listen()
