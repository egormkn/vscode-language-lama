# Lama Language extension for VSCode

[![Build Status](https://travis-ci.com/egormkn/vscode-language-lama.svg?branch=master)](https://travis-ci.com/egormkn/vscode-language-lama)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/egormkn.vscode-language-lama)](https://marketplace.visualstudio.com/items?itemName=egormkn.vscode-language-lama)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/egormkn.vscode-language-lama)](https://marketplace.visualstudio.com/_apis/public/gallery/publishers/egormkn/vsextensions/vscode-language-lama/latest/vspackage)
[![Visual Studio Marketplace Rating (Stars)](https://img.shields.io/visual-studio-marketplace/stars/egormkn.vscode-language-lama)](https://marketplace.visualstudio.com/items?itemName=egormkn.vscode-language-lama&ssr=false#review-details)


An extension for Visual Studio Code that adds some basic editing features such as syntax highlighting, code folding, snippets and syntax checking for the [Lama](https://github.com/JetBrains-Research/Lama) language.

## Features

- Syntax highlighting

  ![Syntax highlighting](images/highlighting.png)

- Type definitions (only highlighting for now)

  ![Type definitions](images/typedefs.png)

- Code snippets

  ![Code snippets](images/snippets.png)

- Syntax validation

  ![Syntax validation](images/validation.png)


## Development

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to compile the client and server.
- Switch to the Debug viewlet.
- Select `Launch Client` from the drop down.
- Run the launch config.
- If you want to debug the server as well use the launch configuration `Attach to Server`
- In the [Extension Development Host] instance of VSCode, open a *.lama source file.

## License

Lama Language extension is released under the [MIT License](LICENSE).
