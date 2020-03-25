import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentChangeRegistrationOptions,
  ClientCapabilities,
  TextDocumentSyncOptions,
  TextDocumentSyncKind,
  TextDocumentChangeEvent,
  DidChangeWatchedFilesParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
  DidChangeConfigurationParams
} from 'vscode-languageserver'

import { TextDocument } from 'vscode-languageserver-textdocument'

import { lexer } from './lexer'
import { Parser } from './parser'
import { Environment } from './environment'

const parser = new Parser()

// Create an IPC connection for the server and include all preview / proposed LSP features
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

// Default client capabilities
let capabilities: ClientCapabilities
let workspace: WorkspaceFolder[] | null

connection.onInitialize((params: InitializeParams) => {

  connection.console.log("Initializing Lama Language Server...")

  capabilities = params.capabilities
  workspace = params.workspaceFolders

  connection.console.log("Capabilities:")
  connection.console.log(JSON.stringify(capabilities, undefined, 2))

  connection.console.log("Workspace folders:")
  connection.console.log(JSON.stringify(workspace, undefined, 2))

  connection.console.log("Client info:")
  connection.console.log(JSON.stringify(params.clientInfo, undefined, 2))

  // hasConfigurationCapability = !!capabilities.workspace?.configuration;
  // hasWorkspaceFolderCapability = !!capabilities.workspace?.workspaceFolders;
  // hasDiagnosticRelatedInformationCapability = !!capabilities.textDocument?.publishDiagnostics?.relatedInformation;

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        resolveProvider: true
      }
    }
  }
})

connection.onInitialized(() => {
  if (capabilities.workspace?.configuration) {
    connection.client.register(DidChangeConfigurationNotification.type, {
      section: 'lama'
    })
  }
  if (capabilities.workspace?.workspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders((change: WorkspaceFoldersChangeEvent) => {
      connection.console.log(`Workspace folder change event received`)
    })
  }
})

interface Settings {
  maxNumberOfProblems: number;
  sdkPath?: string;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: Settings = {
  maxNumberOfProblems: 100
}
let globalSettings: Settings = defaultSettings

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<Settings>> = new Map()

function getDocumentSettings (resource: string): Thenable<Settings> {
  if (!capabilities.workspace?.configuration) {
    return Promise.resolve(globalSettings)
  }
  let result = documentSettings.get(resource)
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'lama'
    })
    connection.console.log(`Retrieved configuration: ${JSON.stringify(result)}`)
    documentSettings.set(resource, result)
  }
  return result
}

async function validateTextDocument (textDocument: TextDocument): Promise<void> {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(textDocument.uri)

  const text = textDocument.getText()

  const diagnostics: Diagnostic[] = []

  const { errors, groups, tokens } = lexer.tokenize(text)

  if (errors.length > 0) {
    console.log("Lexer errors:")
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
      diagnostics.push(diagnostic)
    })
  }

  parser.parse(new Environment(), tokens)

  if (parser.errors.length > 0) {
    console.log("Parser errors:")
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
      diagnostics.push(diagnostic)
    })
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onDidChangeConfiguration((change: DidChangeConfigurationParams) => {

  console.log('Configuration changed')

  if (capabilities.workspace?.configuration) {
    documentSettings.clear() // Reset all cached document settings
  } else {
    globalSettings = (change.settings.lama || defaultSettings) as Settings
  }

  documents.all().forEach(validateTextDocument) // Revalidate all open text documents
})

// Only keep settings for open documents
documents.onDidClose((change: TextDocumentChangeEvent<TextDocument>) => {
  documentSettings.delete(change.document.uri)
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>) => {
  console.log(`Document content changed: ${change.document.uri}`)
  validateTextDocument(change.document)
})

connection.onDidChangeWatchedFiles((change: DidChangeWatchedFilesParams) => {
  connection.console.log(`Watched files changed: ${change.changes.map(c => c.uri).join('\n')}`)
})

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: 'TypeScript',
      kind: CompletionItemKind.Text,
      data: 1
    },
    {
      label: 'JavaScript',
      kind: CompletionItemKind.Text,
      data: 2
    }
  ]
}
)

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data === 1) {
    item.detail = 'TypeScript details'
    item.documentation = 'TypeScript documentation'
  } else if (item.data === 2) {
    item.detail = 'JavaScript details'
    item.documentation = 'JavaScript documentation'
  }
  return item
}
)

connection.onDidOpenTextDocument((params) => {
  // A text document got opened in VSCode.
  // params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
  // params.textDocument.text the initial full content of the document.
  connection.console.log(`${params.textDocument.uri} opened.`)
})
connection.onDidChangeTextDocument((params) => {
  // The content of a text document did change in VSCode.
  // params.textDocument.uri uniquely identifies the document.
  // params.contentChanges describe the content changes to the document.
  connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`)
})
connection.onDidCloseTextDocument((params) => {
  // A text document got closed in VSCode.
  // params.textDocument.uri uniquely identifies the document.
  connection.console.log(`${params.textDocument.uri} closed.`)
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

connection.listen() // Listen on the connection
