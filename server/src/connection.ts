import { IConnection, createConnection, ProposedFeatures, TextDocumentSyncKind, ClientCapabilities, WorkspaceFolder } from 'vscode-languageserver'

// Create an IPC connection for the server and include all preview / proposed LSP features
export const connection: IConnection = createConnection(ProposedFeatures.all)

connection.console.info(`Lama server running in node ${process.version}`)

interface ClientInfo {
  name: string
  version?: string
}

// Default client capabilities
export let capabilities: ClientCapabilities
export let workspace: WorkspaceFolder[] | null
export let client: ClientInfo | undefined

connection.onInitialize(params => {

  connection.console.log('Initializing Lama Language Server...')

  capabilities = params.capabilities
  workspace = params.workspaceFolders
  client = params.clientInfo

  connection.console.log('Capabilities:')
  connection.console.log(JSON.stringify(capabilities, undefined, 2))

  if (workspace !== null) {
    connection.console.log('Workspace folders:')
    workspace.forEach(folder => connection.console.log(`\t${folder.name} (${folder.uri})`))
  }

  if (client !== undefined) {
    connection.console.log(`Client: ${client.name} ${client.version ?? ''}`)
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full
      // {
      //   change: TextDocumentSyncKind.Full,
      //   openClose: true,
      //   save: {
      //     includeText: true
      //   },
      //   willSave: true
      // }
    }
  }
})
