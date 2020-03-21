import * as vscode from 'vscode';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Activates the vscode extension
 */
export async function activate(docUri: vscode.Uri): Promise<void> {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension('vscode-samples.lsp-sample')!;
    await ext.activate();
    try {
        doc = await vscode.workspace.openTextDocument(docUri);
        editor = await vscode.window.showTextDocument(doc);
        await sleep(5000); // Wait for server activation
    } catch (e) {
        console.error(e);
    }
}

export const getDocPath = (p: string): string => {
    return path.resolve(__dirname, '../../testFixture', p);
};
export const getDocUri = (p: string): vscode.Uri => {
    return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
    const all = new vscode.Range(
        doc.positionAt(0),
        doc.positionAt(doc.getText().length)
    );
    return editor.edit(eb => eb.replace(all, content));
}
