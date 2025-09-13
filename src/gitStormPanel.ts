import * as vscode from 'vscode';
import { GitService, Branch, Commit, FileChange } from './gitService';
import { ContextMenuService } from './contextMenuService';
import { getBranchesHtml, getCommitsHtml, getFilesHtml } from './helpers/uiHelpers';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';


export class GitStormPanel {
    public static currentPanel: GitStormPanel | undefined;
    public static readonly viewType = 'gitstorm.panel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _gitService: GitService;
    private readonly _contextMenuService: ContextMenuService;
    private _disposables: vscode.Disposable[] = [];
    private _selectedBranch: string | null = null;
    private _panelSizes: { branches: number; commits: number } = { branches: 280, commits: 400 };

    public static createOrShow(extensionUri: vscode.Uri, gitService: GitService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (GitStormPanel.currentPanel) {
            GitStormPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            GitStormPanel.viewType,
            'GitStorm',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates'),
                    vscode.Uri.joinPath(extensionUri, 'src', 'styles'),
                    vscode.Uri.joinPath(extensionUri, 'src', 'webview')
                ],
                retainContextWhenHidden: true
            }
        );

        GitStormPanel.currentPanel = new GitStormPanel(panel, extensionUri, gitService);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, gitService: GitService) {
        GitStormPanel.currentPanel = new GitStormPanel(panel, extensionUri, gitService);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, gitService: GitService) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._gitService = gitService;
        this._contextMenuService = new ContextMenuService(gitService);

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'refresh':
                    await this.refresh();
                    return;
                case 'selectBranch':
                    this._selectedBranch = message.branchName;
                    await this.refresh();
                    return;
                case 'selectCommit':
                    await this._handleCommitSelection(message.hash);
                    return;
                case 'squashCommits':
                    await this._handleSquashCommits(message.commitHashes, message.message);
                    return;
                case 'test':
                    console.log('Test message received from WebView:', message.data);
                    return;
                case 'savePanelSizes':
                    this._panelSizes = message.sizes;
                    return;
                case 'showBranchContextMenu':
                    await this._contextMenuService.showBranchContextMenu({ name: message.branchName, isLocal: true, isRemote: false, isCurrent: false, commit: '' }, this._panel.webview);
                    return;
                case 'showCommitContextMenu':
                    await this._contextMenuService.showCommitContextMenu({ hash: message.hash, shortHash: message.hash.substring(0, 7), message: '', author: '', date: new Date(), parents: [], refs: [] }, this._panel.webview);
                    return;
                case 'getCommitDetails':
                    console.log('Backend: Handling getCommitDetails for hash:', message.hash);
                    await this._handleGetCommitDetails(message.hash);
                    return;
                case 'getMultiCommitFiles':
                    console.log('Backend: Handling getMultiCommitFiles for hashes:', message.hashes);
                    await this._handleGetMultiCommitFiles(message.hashes);
                    return;
                case 'showFileDiff':
                    await this._handleShowFileDiff(message.filePath, message.commitHash);
                    return;
            }
        }, null, this._disposables);

        // Send initial data after a short delay to ensure WebView is ready
        setTimeout(() => {
            this._sendInitialData();
        }, 100);
    }

    public async refresh() {
        await this._sendInitialData();
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private async _sendInitialData() {
        try {
            console.log('Getting branches...');
            const branches = await this._gitService.getBranches();
            console.log('Loaded branches:', branches);

            console.log('Getting commits for branch:', this._selectedBranch);
            const commits = await this._gitService.getCommits(this._selectedBranch || undefined);
            console.log('Loaded commits:', commits);

            // Send data to WebView for content update
            console.log('Sending data to WebView:', { branches: branches.length, commits: commits.length });
            this._panel.webview.postMessage({
                command: 'updateContent',
                branches: branches,
                commits: commits,
                error: null,
                selectedBranch: this._selectedBranch,
                panelSizes: this._panelSizes
            });

        } catch (error) {
            console.error('Error loading data:', error);
            this._panel.webview.postMessage({
                command: 'updateContent',
                branches: null,
                commits: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                selectedBranch: this._selectedBranch,
                panelSizes: this._panelSizes
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Load HTML template
        const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'templates', 'panel.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Load CSS
        const cssPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'styles', 'panel.css'));
        
        // Load JS
        const jsPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'panel.js'));

        // Inject CSS and JS paths
        htmlContent = htmlContent.replace('<!-- CSS_PLACEHOLDER -->', `<link href="${cssPath}" rel="stylesheet">`);
        htmlContent = htmlContent.replace('<!-- JS_PLACEHOLDER -->', `<script src="${jsPath}"></script>`);
        
        // Inject initial panel sizes
        htmlContent = htmlContent.replace('<!-- INITIAL_PANEL_SIZES_PLACEHOLDER -->', 
            `<script>var initialPanelSizes = { branches: ${this._panelSizes.branches}, commits: ${this._panelSizes.commits} };</script>`);

        return htmlContent;
    }

    private async _handleCommitSelection(hash: string) {
        try {
            // For now, just show a placeholder message
            // TODO: Implement getCommitFiles method in GitService
            this._panel.webview.postMessage({
                command: 'updateFiles',
                files: []
            });
        } catch (error) {
            console.error('Error loading commit files:', error);
        }
    }

    private async _handleSquashCommits(commitHashes: string[], message: string) {
        try {
            await this._gitService.squashCommits(commitHashes, message);
            vscode.window.showInformationMessage('Commits squashed successfully');
            await this.refresh();
        } catch (error) {
            console.error('Error squashing commits:', error);
            vscode.window.showErrorMessage(`Failed to squash commits: ${error}`);
        }
    }

    private async _handleGetCommitDetails(hash: string) {
        try {
            console.log('Getting commit details for:', hash);
            const commit = await this._gitService.getCommitDetails(hash);
            if (commit) {
                console.log('Backend: Sending commitDetails with files:', commit.files?.length || 0);
                this._panel.webview.postMessage({
                    command: 'commitDetails',
                    commit: commit,
                    files: commit.files || []
                });
            } else {
                console.log('Backend: Sending commitDetails with no commit');
                this._panel.webview.postMessage({
                    command: 'commitDetails',
                    commit: null,
                    files: []
                });
            }
        } catch (error) {
            console.error('Error getting commit details:', error);
            this._panel.webview.postMessage({
                command: 'commitDetails',
                commit: null,
                files: []
            });
        }
    }

    private async _handleGetMultiCommitFiles(hashes: string[]) {
        try {
            // console.log('Getting multi-commit files for:', hashes);
            const files = await this._gitService.getMultiCommitFiles(hashes);
            this._panel.webview.postMessage({
                command: 'multiCommitFiles',
                files: files
            });
        } catch (error) {
            console.error('Error getting multi-commit files:', error);
            this._panel.webview.postMessage({
                command: 'multiCommitFiles',
                files: []
            });
        }
    }
    
    
     private async _handleShowFileDiff(filePath: string, commitHash?: string, parentIndex = 1) {
       try {
         const ws = vscode.workspace.workspaceFolders?.[0];
         if (!ws) {
           vscode.window.showErrorMessage('No workspace folder found');
           return;
         }
     
         const fileUri = vscode.Uri.joinPath(ws.uri, filePath);
     
         if (commitHash) {
           // Get the diff content using our git service
           const diffContent = await this._gitService.getFileDiff(commitHash, filePath);
           
           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} in commit ${commitHash.substring(0, 7)}`);
             return;
           }
           
           // Create a temporary document with the diff content
           const diffDocument = await vscode.workspace.openTextDocument({
             content: diffContent,
             language: 'diff'
           });
           
           // Show the diff document
           await vscode.window.showTextDocument(diffDocument, {
             viewColumn: vscode.ViewColumn.Beside,
             preview: false
           });
           
           // Set the title
           vscode.window.setStatusBarMessage(`Diff for ${filePath} (${commitHash.substring(0, 7)})`, 5000);
           
         } else {
           // Show current changes using Git extension
           const gitExt = vscode.extensions.getExtension('vscode.git')?.exports;
           if (!gitExt) {
             vscode.window.showErrorMessage('Git extension not available');
             return;
           }
           
           await vscode.commands.executeCommand(
             'git.openChange',
             fileUri
           );
         }
         
       } catch (err) {
         console.error('Error showing file diff:', err);
         vscode.window.showErrorMessage(`Failed to show file diff: ${String(err)}`);
       }
     }
    
    

    public dispose() {
        GitStormPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
