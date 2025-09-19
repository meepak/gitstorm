import * as vscode from 'vscode';
import { GitService } from '../../git/gitService';
import { ContextMenuService } from '../services/ContextMenuService';
import { MessageHandler } from '../handlers/MessageHandler';
import { WebviewRenderer } from '../services/WebviewRenderer';
import { PanelManager } from '../utils/PanelManager';

export class GitStormPanel {
    public static currentPanel: GitStormPanel | undefined;
    public static readonly viewType = 'gitstorm.panel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _gitService: GitService;
    private readonly _contextMenuService: ContextMenuService;
    private readonly _messageHandler: MessageHandler;
    private readonly _webviewRenderer: WebviewRenderer;
    private readonly _panelManager: PanelManager;
    private _disposables: vscode.Disposable[] = [];
    private _selectedBranch: string | null = null;
    private _panelSizes: { branches: number; commits: number } = { branches: 280, commits: 400 };

    public static createOrShow(extensionUri: vscode.Uri, gitService: GitService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (GitStormPanel.currentPanel) {
            GitStormPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            GitStormPanel.viewType,
            'GitStorm',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ]
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
        this._contextMenuService = new ContextMenuService();
        this._messageHandler = new MessageHandler(this);
        this._webviewRenderer = new WebviewRenderer(extensionUri);
        this._panelManager = new PanelManager(this);

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => this._messageHandler.handleMessage(message),
            null,
            this._disposables
        );

        // Send initial data after a short delay to ensure webview is ready
        setTimeout(async () => {
            console.log('Sending initial data to webview...');
            await this._sendInitialData();
        }, 100);
    }

    public async refresh() {
        await this._sendInitialData();
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._webviewRenderer.getHtmlForWebview(webview);
    }

    private async _sendInitialData() {
        try {
            console.log('Getting branches...');
            const branches = await this._gitService.getBranches();
            console.log('Loaded branches:', branches);

            console.log('Getting commits for branch:', this._selectedBranch);
            const commits = await this._gitService.getCommits(this._selectedBranch || undefined);
            console.log('Loaded commits:', commits);

            // Check for uncommitted changes if we're on the current branch
            let hasUncommittedChanges = false;
            const currentBranch = await this._gitService.getCurrentBranch();
            if (currentBranch && (!this._selectedBranch || this._selectedBranch === currentBranch)) {
                hasUncommittedChanges = await this._gitService.hasUncommittedChanges();
            }

            this._panel.webview.postMessage({
                command: 'updateContent',
                branches: branches,
                commits: commits,
                hasUncommittedChanges: hasUncommittedChanges
            });
        } catch (error) {
            console.error('Error loading initial data:', error);
            this._panel.webview.postMessage({
                command: 'updateContent',
                branches: [],
                commits: [],
                error: error instanceof Error ? error.message : 'Unknown error',
                hasUncommittedChanges: false
            });
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

    // Getters for services
    get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    get gitService(): GitService {
        return this._gitService;
    }

    get extensionUri(): vscode.Uri {
        return this._extensionUri;
    }

    get selectedBranch(): string | null {
        return this._selectedBranch;
    }

    set selectedBranch(value: string | null) {
        this._selectedBranch = value;
    }

    get panelSizes(): { branches: number; commits: number } {
        return this._panelSizes;
    }

    set panelSizes(value: { branches: number; commits: number }) {
        this._panelSizes = value;
    }
}
