import * as path from 'path'

import { workspace, commands, window, ExtensionContext } from 'vscode'

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  NodeModule
} from 'vscode-languageclient'

let client: LanguageClient

export function activate (context: ExtensionContext): void {
  console.log('Lama Language extension is activated')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = commands.registerCommand('lama.run', async () => {
    await window.showInformationMessage('Not implemented yet')
  })

  context.subscriptions.push(disposable)

  // The server is implemented in node
  const serverModule: NodeModule = {
    module: context.asAbsolutePath(
      path.join('server', 'out', 'server.js')
    ),
    transport: TransportKind.ipc
  }

  // If the extension is launched in debug mode then the debug server
  // options are used. Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { ...serverModule },
    debug: {
      ...serverModule,
      options: {
        // run the server in Node's Inspector mode
        // so VS Code can attach to the server for debugging
        execArgv: ['--nolazy', '--inspect=6009']
      }
    }
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for lama documents
    documentSelector: [{ language: 'lama' }],
    synchronize: {
      // Notify the server about file changes to *.lama files
      fileEvents: workspace.createFileSystemWatcher('**/*.lama')
    }
  }

  // Create the language client and start the client.
  client = new LanguageClient(
    'lamals',
    'Lama Language Server',
    serverOptions,
    clientOptions
  )

  // Start the client. This will also launch the server
  client.start()
}

export function deactivate (): Thenable<void> | undefined {
  console.log('Lama Language extension is deactivated')

  // eslint-disable-next-line @typescript-eslint/return-await
  return client?.stop()
}
