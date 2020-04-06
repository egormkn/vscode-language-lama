import {
  ClientCapabilities,
  IConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  WorkspaceFolder,
  createConnection
} from 'vscode-languageserver'

// Create an IPC connection for the server using all preview / proposed LSP features
const connection: IConnection = createConnection(ProposedFeatures.all)

interface ClientInfo {
  name: string
  version?: string
}

let capabilities: ClientCapabilities
let workspace: WorkspaceFolder[] | null
let client: ClientInfo | undefined

connection.onInitialize(params => {
  connection.console.log('Initializing Lama Language Server...')

  capabilities = params.capabilities
  workspace = params.workspaceFolders
  client = params.clientInfo

  connection.console.log('Capabilities:')
  connection.console.log(JSON.stringify(capabilities, null, 2))

  if (workspace !== null) {
    connection.console.log('Workspace folders:')
    workspace.forEach(folder => connection.console.log(`\t${folder.name} (${folder.uri})`))
  }

  if (client !== undefined) {
    connection.console.log(`Client: ${client.name} ${client.version ?? ''}`)
  }

  connection.console.info(`Lama server running in node ${process.version}`)

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

export { connection, capabilities, workspace, client }
