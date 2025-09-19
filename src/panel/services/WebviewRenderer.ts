import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class WebviewRenderer {
    constructor(private readonly extensionUri: vscode.Uri) {}

    getHtmlForWebview(webview: vscode.Webview): string {
        // Load HTML template
        const htmlPath = path.join(this.extensionUri.fsPath, 'src', 'templates', 'panel.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Load CSS
        const cssPath = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'styles', 'panel.css'));
        
        // Load JS files
        const jsFiles = [
            'core/PanelController.js',
            'handlers/MessageHandler.js', 
            'handlers/ContextMenuHandler.js',
            'renderers/BranchRenderer.js',
            'renderers/CommitRenderer.js',
            'renderers/FileChangesRenderer.js',
            'renderers/FilterRenderer.js',
            'renderers/IconRenderer.js',
            'renderers/UIRenderer.js',
            'managers/SearchManager.js',
            'operations/GitOperations.js',
            'globals.js'
        ];
        
        const jsScripts = jsFiles.map(file => {
            const jsPath = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', file));
            return `<script src="${jsPath}"></script>`;
        }).join('\n    ');

        // Inject CSS and JS paths
        htmlContent = htmlContent.replace('<!-- CSS_PLACEHOLDER -->', `<link href="${cssPath}" rel="stylesheet">`);
        htmlContent = htmlContent.replace('<!-- Load JavaScript modules in correct order -->', jsScripts);
        
        // Inject initial panel sizes
        htmlContent = htmlContent.replace('<!-- INITIAL_PANEL_SIZES_PLACEHOLDER -->', 
            `<script>
                document.addEventListener('DOMContentLoaded', () => {
                    if (panelController) {
                        panelController.panelSizes = { branches: 280, commits: 400, files: 300 };
                        panelController.restorePanelSizes();
                    }
                });
            </script>`
        );

        return htmlContent;
    }
}
