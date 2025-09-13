import * as vscode from 'vscode';
import { GitService, Branch, Commit, FileChange } from './gitService';
import { ContextMenuService } from './contextMenuService';

export class GitStormPanel {
    public static currentPanel: GitStormPanel | undefined;
    public static readonly viewType = 'gitstorm.panel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _gitService: GitService;
    private readonly _contextMenuService: ContextMenuService;
    private _disposables: vscode.Disposable[] = [];

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
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
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
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'refresh':
                        await this.refresh();
                        return;
                    
                    case 'getBranches':
                        const branches = await this._gitService.getBranches();
                        this._panel.webview.postMessage({
                            command: 'branchesData',
                            data: branches
                        });
                        return;
                    
                    case 'getCommits':
                        const commits = await this._gitService.getCommits(message.branch, message.limit);
                        this._panel.webview.postMessage({
                            command: 'commitsData',
                            data: commits
                        });
                        return;
                    
                    case 'getCommitDetails':
                        const commitDetails = await this._gitService.getCommitDetails(message.hash);
                        this._panel.webview.postMessage({
                            command: 'commitDetails',
                            data: commitDetails
                        });
                        return;
                    
                    case 'checkoutBranch':
                        const success = await this._gitService.checkoutBranch(message.branchName);
                        this._panel.webview.postMessage({
                            command: 'checkoutResult',
                            success
                        });
                        if (success) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'createBranch':
                        const createSuccess = await this._gitService.createBranch(message.branchName, message.fromBranch);
                        this._panel.webview.postMessage({
                            command: 'createBranchResult',
                            success: createSuccess
                        });
                        if (createSuccess) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'deleteBranch':
                        const deleteSuccess = await this._gitService.deleteBranch(message.branchName, message.force);
                        this._panel.webview.postMessage({
                            command: 'deleteBranchResult',
                            success: deleteSuccess
                        });
                        if (deleteSuccess) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'mergeBranch':
                        const mergeSuccess = await this._gitService.mergeBranch(message.branchName);
                        this._panel.webview.postMessage({
                            command: 'mergeResult',
                            success: mergeSuccess
                        });
                        if (mergeSuccess) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'rebaseBranch':
                        const rebaseSuccess = await this._gitService.rebaseBranch(message.branchName);
                        this._panel.webview.postMessage({
                            command: 'rebaseResult',
                            success: rebaseSuccess
                        });
                        if (rebaseSuccess) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'cherryPickCommit':
                        const cherryPickSuccess = await this._gitService.cherryPickCommit(message.hash);
                        this._panel.webview.postMessage({
                            command: 'cherryPickResult',
                            success: cherryPickSuccess
                        });
                        if (cherryPickSuccess) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'revertCommit':
                        const revertSuccess = await this._gitService.revertCommit(message.hash);
                        this._panel.webview.postMessage({
                            command: 'revertResult',
                            success: revertSuccess
                        });
                        if (revertSuccess) {
                            await this.refresh();
                        }
                        return;
                    
                    case 'getFileDiff':
                        const diff = await this._gitService.getFileDiff(message.hash, message.file);
                        this._panel.webview.postMessage({
                            command: 'fileDiff',
                            data: diff
                        });
                        return;
                    
                    case 'showBranchContextMenu':
                        const branch = message.branch;
                        await this._contextMenuService.showBranchContextMenu(branch, this._panel.webview);
                        return;
                    
                    case 'showCommitContextMenu':
                        const commit = message.commit;
                        await this._contextMenuService.showCommitContextMenu(commit, this._panel.webview);
                        return;
                    
                    case 'getMultiCommitFiles':
                        const multiFiles = await this._gitService.getMultiCommitFiles(message.commitHashes);
                        this._panel.webview.postMessage({
                            command: 'multiCommitFiles',
                            data: multiFiles
                        });
                        return;
                    
                    case 'getMultiCommitDiff':
                        const multiDiff = await this._gitService.getMultiCommitDiff(message.commitHashes);
                        this._panel.webview.postMessage({
                            command: 'multiCommitDiff',
                            data: multiDiff
                        });
                        return;
                    
                    case 'squashCommits':
                        const squashSuccess = await this._gitService.squashCommits(message.commitHashes, message.message);
                        this._panel.webview.postMessage({
                            command: 'squashResult',
                            success: squashSuccess
                        });
                        if (squashSuccess) {
                            await this.refresh();
                        }
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public async refresh() {
        await this._update();
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        
        // Check if we're in a Git repository first
        const isGitRepo = await this._gitService.isGitRepository();
        
        if (!isGitRepo) {
            webview.postMessage({
                command: 'noGitRepository',
                message: 'No Git repository found in current workspace'
            });
            return;
        }
        
        // Load initial data
        const branches = await this._gitService.getBranches();
        const currentBranch = branches.find(b => b.isCurrent);
        const commits = await this._gitService.getCommits(currentBranch?.name, 50);
        
        webview.postMessage({
            command: 'initialData',
            data: { branches, commits }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitStorm Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 8px 12px;
            background-color: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .squash-button {
            padding: 4px 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            display: none;
        }

        .squash-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .squash-button.visible {
            display: block;
        }

        .header h1 {
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-titleBar-activeForeground);
        }

        .main-content {
            display: flex;
            flex: 1;
            min-height: 0;
        }

        .panel {
            border-right: 1px solid var(--vscode-panel-border);
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .panel:last-child {
            border-right: none;
        }

        .branches-panel {
            width: 280px;
            min-width: 200px;
        }

        .commits-panel {
            width: 400px;
            min-width: 300px;
        }

        .files-panel {
            flex: 1;
            min-width: 300px;
        }

        .panel-header {
            padding: 8px 12px;
            background-color: var(--vscode-panel-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .panel-content {
            flex: 1;
            overflow: auto;
            padding: 8px;
        }

        .branch-item {
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            margin: 1px 0;
        }

        .branch-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .branch-item.current {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .branch-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .branch-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .branch-refs {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .commit-item {
            padding: 6px 8px;
            cursor: pointer;
            border-radius: 3px;
            margin: 1px 0;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 12px;
            border-left: 3px solid transparent;
        }

        .commit-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .commit-item.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
            border-left-color: var(--vscode-focusBorder);
        }

        .commit-graph {
            font-family: monospace;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            min-width: 40px;
            line-height: 1.2;
        }

        .commit-content {
            flex: 1;
            min-width: 0;
        }

        .commit-hash {
            font-family: monospace;
            font-size: 11px;
            color: var(--vscode-textLink-foreground);
            margin-right: 6px;
        }

        .commit-message {
            font-weight: 500;
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .commit-meta {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            display: flex;
            gap: 8px;
        }

        .file-item {
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 3px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            margin: 1px 0;
        }

        .file-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .file-status {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border-radius: 2px;
        }

        .file-status.added { background-color: var(--vscode-gitDecoration-addedResourceForeground); color: white; }
        .file-status.deleted { background-color: var(--vscode-gitDecoration-deletedResourceForeground); color: white; }
        .file-status.modified { background-color: var(--vscode-gitDecoration-modifiedResourceForeground); color: white; }

        .file-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .file-stats {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-family: monospace;
        }

        .diff-viewer {
            padding: 12px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.4;
            white-space: pre-wrap;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            max-height: 400px;
            overflow: auto;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
        }

        .empty-state h3 {
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        .search-box {
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .search-input {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 13px;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>GitStorm</h1>
        <button onclick="refreshData()">Refresh</button>
        <button class="squash-button" id="squashButton" onclick="showSquashDialog()">Squash Selected</button>
    </div>
    
    <div class="main-content">
        <!-- Branches Panel -->
        <div class="panel branches-panel">
            <div class="panel-header">Branches</div>
            <div class="search-box">
                <input type="text" class="search-input" placeholder="Search branches..." id="branchSearch">
            </div>
            <div class="panel-content" id="branchesContent">
                <div class="loading">Loading branches...</div>
            </div>
        </div>

        <!-- Commits Panel -->
        <div class="panel commits-panel">
            <div class="panel-header">Commits</div>
            <div class="search-box">
                <input type="text" class="search-input" placeholder="Search commits..." id="commitSearch">
            </div>
            <div class="panel-content" id="commitsContent">
                <div class="loading">Loading commits...</div>
            </div>
        </div>

        <!-- Files Panel -->
        <div class="panel files-panel">
            <div class="panel-header">File Changes</div>
            <div class="panel-content" id="filesContent">
                <div class="empty-state">
                    <h3>No selection</h3>
                    <p>Select a commit to view file changes</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentBranch = null;
        let selectedCommits = new Set();
        let branches = [];
        let commits = [];

        // Load initial data
        vscode.postMessage({ command: 'getBranches' });

        function refreshData() {
            vscode.postMessage({ command: 'refresh' });
            vscode.postMessage({ command: 'getBranches' });
        }

        function renderBranches(branchesData) {
            branches = branchesData;
            const container = document.getElementById('branchesContent');
            
            if (branchesData.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No branches found</h3></div>';
                return;
            }

            const html = branchesData.map(branch => {
                const isCurrent = branch.isCurrent ? 'current' : '';
                const typeIcon = branch.isRemote ? '🌐' : '🌿';
                const refs = branch.ahead || branch.behind ? 
                    \`+\${branch.ahead || 0} -\${branch.behind || 0}\` : '';

                return \`
                    <div class="branch-item \${isCurrent}" 
                         onclick="selectBranch('\${branch.name}')"
                         oncontextmenu="showBranchContextMenu(\${JSON.stringify(branch)}); return false;">
                        <div class="branch-icon">\${typeIcon}</div>
                        <div class="branch-name">\${branch.name}</div>
                        <div class="branch-refs">\${refs}</div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = html;
        }

        function renderCommits(commitsData) {
            commits = commitsData;
            const container = document.getElementById('commitsContent');
            
            if (commitsData.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No commits found</h3></div>';
                return;
            }

            const html = commitsData.map(commit => {
                const isSelected = selectedCommits.has(commit.hash) ? 'selected' : '';
                const date = new Date(commit.date).toLocaleDateString();
                const refs = commit.refs.join(', ');

                return \`
                    <div class="commit-item \${isSelected}" 
                         onclick="selectCommit('\${commit.hash}')"
                         oncontextmenu="showCommitContextMenu(\${JSON.stringify(commit)}); return false;">
                        <div class="commit-graph">●</div>
                        <div class="commit-content">
                            <div>
                                <span class="commit-hash">\${commit.shortHash}</span>
                                <span class="commit-message">\${commit.message}</span>
                            </div>
                            <div class="commit-meta">
                                <span>\${commit.author}</span>
                                <span>\${date}</span>
                                <span>\${refs}</span>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = html;
        }

        function renderFiles(filesData) {
            const container = document.getElementById('filesContent');
            
            if (!filesData || filesData.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No files changed</h3></div>';
                return;
            }

            const html = filesData.map(file => {
                const statusClass = file.status.toLowerCase();
                const statusIcon = file.status === 'A' ? '+' : file.status === 'D' ? '-' : 'M';
                const stats = \`+\${file.additions} -\${file.deletions}\`;

                return \`
                    <div class="file-item" onclick="showFileDiff('\${file.file}')">
                        <div class="file-status \${statusClass}">\${statusIcon}</div>
                        <div class="file-name">\${file.file}</div>
                        <div class="file-stats">\${stats}</div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = html;
        }

        function selectBranch(branchName) {
            currentBranch = branchName;
            selectedCommits.clear();
            vscode.postMessage({ 
                command: 'getCommits', 
                branch: branchName,
                limit: 50 
            });
        }

        function selectCommit(hash) {
            if (selectedCommits.has(hash)) {
                selectedCommits.delete(hash);
            } else {
                selectedCommits.add(hash);
            }
            
            // Re-render commits to show selection
            renderCommits(commits);
            
            // Update squash button visibility
            updateSquashButton();
            
            // Get file details for selected commit(s)
            if (selectedCommits.size === 1) {
                vscode.postMessage({ 
                    command: 'getCommitDetails', 
                    hash: Array.from(selectedCommits)[0] 
                });
            } else if (selectedCommits.size > 1) {
                // Handle multi-select (squash view)
                renderMultiCommitFiles();
            } else {
                document.getElementById('filesContent').innerHTML = 
                    '<div class="empty-state"><h3>No selection</h3><p>Select a commit to view file changes</p></div>';
            }
        }

        function renderMultiCommitFiles() {
            const commitHashes = Array.from(selectedCommits);
            vscode.postMessage({
                command: 'getMultiCommitFiles',
                commitHashes: commitHashes
            });
        }

        function showSquashDialog() {
            const commitHashes = Array.from(selectedCommits);
            const selectedCommitsList = commits.filter(c => selectedCommits.has(c.hash));
            
            const defaultMessage = selectedCommitsList.map(c => c.message).join('\n');
            
            // Show input box for squash message
            // In a real implementation, this would be a proper dialog
            const message = prompt('Enter commit message for squashed commit:', defaultMessage);
            if (message) {
                vscode.postMessage({
                    command: 'squashCommits',
                    commitHashes: commitHashes,
                    message: message
                });
            }
        }

        function showFileDiff(fileName) {
            if (selectedCommits.size === 1) {
                vscode.postMessage({ 
                    command: 'getFileDiff', 
                    hash: Array.from(selectedCommits)[0],
                    file: fileName 
                });
            }
        }

        function showBranchContextMenu(branch) {
            vscode.postMessage({
                command: 'showBranchContextMenu',
                branch: branch
            });
        }

        function showCommitContextMenu(commit) {
            vscode.postMessage({
                command: 'showCommitContextMenu',
                commit: commit
            });
        }

        function updateSquashButton() {
            const squashButton = document.getElementById('squashButton');
            if (selectedCommits.size > 1) {
                squashButton.classList.add('visible');
                squashButton.textContent = \`Squash Selected (\${selectedCommits.size})\`;
            } else {
                squashButton.classList.remove('visible');
            }
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'initialData':
                    renderBranches(message.data.branches);
                    renderCommits(message.data.commits);
                    break;
                case 'branchesData':
                    renderBranches(message.data);
                    break;
                case 'commitsData':
                    renderCommits(message.data);
                    break;
                case 'commitDetails':
                    if (message.data && message.data.files) {
                        renderFiles(message.data.files);
                    }
                    break;
                case 'fileDiff':
                    showDiffViewer(message.data);
                    break;
                case 'multiCommitFiles':
                    renderFiles(message.data);
                    break;
                case 'multiCommitDiff':
                    showDiffViewer(message.data);
                    break;
                case 'squashResult':
                    if (message.success) {
                        selectedCommits.clear();
                        updateSquashButton();
                        refreshData();
                    } else {
                        alert('Failed to squash commits');
                    }
                    break;
                case 'noGitRepository':
                    showNoGitRepositoryMessage(message.message);
                    break;
            }
        });

        function showDiffViewer(diff) {
            document.getElementById('filesContent').innerHTML = 
                \`<div class="diff-viewer">\${diff}</div>\`;
        }

        function showNoGitRepositoryMessage(message) {
            const branchesContent = document.getElementById('branchesContent');
            const commitsContent = document.getElementById('commitsContent');
            const filesContent = document.getElementById('filesContent');
            
            const noGitHtml = \`
                <div class="empty-state">
                    <h3>No Git Repository</h3>
                    <p>\${message}</p>
                    <p>Please open a folder that contains a Git repository (with a .git folder).</p>
                </div>
            \`;
            
            branchesContent.innerHTML = noGitHtml;
            commitsContent.innerHTML = noGitHtml;
            filesContent.innerHTML = noGitHtml;
        }

        // Search functionality
        document.getElementById('branchSearch').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredBranches = branches.filter(branch => 
                branch.name.toLowerCase().includes(searchTerm)
            );
            renderBranches(filteredBranches);
        });

        document.getElementById('commitSearch').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredCommits = commits.filter(commit => 
                commit.message.toLowerCase().includes(searchTerm) ||
                commit.author.toLowerCase().includes(searchTerm) ||
                commit.hash.toLowerCase().includes(searchTerm)
            );
            renderCommits(filteredCommits);
        });
    </script>
</body>
</html>`;
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
