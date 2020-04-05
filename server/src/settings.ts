export interface Settings {
  maxNumberOfProblems: number
  sdkPath?: string
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
export const defaultSettings: Settings = {
  maxNumberOfProblems: 100
}

// eslint-disable-next-line prefer-const
export let globalSettings: Settings = defaultSettings

// Cache the settings of all open documents
export const documentSettings: Map<string, Thenable<Settings>> = new Map()
