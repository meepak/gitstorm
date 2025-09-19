import * as vscode from 'vscode';
import { GitService, Branch, Commit, FileChange } from './git/gitService';
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
                // Context menu actions are now handled directly in the webview
                case 'getCommitDetails':
                    console.log('Backend: Handling getCommitDetails for hash:', message.commitHashes || message.hash);
                    if (message.commitHashes && message.commitHashes.length > 1) {
                        await this._handleGetMultiCommitFiles(message.commitHashes, message.compareAgainst, message.compareBranch);
                    } else {
                        const hash = message.commitHashes ? message.commitHashes[0] : message.hash;
                        await this._handleGetCommitDetails(hash, message.compareAgainst, message.compareBranch);
                    }
                    return;
                case 'getMultiCommitFiles':
                    console.log('Backend: Handling getMultiCommitFiles for hashes:', message.hashes);
                    await this._handleGetMultiCommitFiles(message.hashes, message.compareAgainst, message.compareBranch);
                    return;
                case 'showFileDiff':
                    await this._handleShowFileDiff(message.filePath, message.commitHash);
                    return;
                case 'showMultiCommitFileDiff':
                    await this._handleShowMultiCommitFileDiff(message.filePath, message.commitHashes);
                    return;
                case 'showFileDiffWithCompare':
                    await this._handleShowFileDiffWithCompare(message.filePath, message.compareData);
                    return;
                case 'showWorkingDirectoryChanges':
                    await this._handleShowWorkingDirectoryChanges();
                    return;
                case 'showEditableDiff':
                    await this._handleShowEditableDiff(message.filePath, message.compareData);
                    return;
                case 'openWorkingFile':
                    await this._handleOpenWorkingFile(message.filePath);
                    return;
                case 'getCommitsWithCompare':
                    await this._handleGetCommitsWithCompare(message.branch, message.compareBranch);
                    return;
                case 'revealFileInExplorer':
                    await this._handleRevealFileInExplorer(message.filePath);
                    return;
                case 'revealDirectoryInExplorer':
                    await this._handleRevealDirectoryInExplorer(message.directoryName);
                    return;
                case 'checkoutBranch':
                    await this._handleCheckoutBranch(message.branchName);
                    return;
                case 'mergeBranch':
                    await this._handleMergeBranch(message.branchName);
                    return;
                case 'deleteBranch':
                    await this._handleDeleteBranch(message.branchName);
                    return;
                case 'createBranchFromCommit':
                    await this._handleCreateBranchFromCommit(message.commitHash);
                    return;
                case 'cherryPickCommit':
                    await this._handleCherryPickCommit(message.commitHash);
                    return;
                case 'revertCommit':
                    await this._handleRevertCommit(message.commitHash);
                    return;
                case 'getUncommittedChanges':
                    await this._handleGetUncommittedChanges();
                    return;
                case 'commitChanges':
                    await this._handleCommitChanges(message.message);
                    return;
                case 'openFile':
                    await this._handleOpenFile(message.fileName);
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

            // Check for uncommitted changes if we're on the current branch
            let hasUncommittedChanges = false;
            const currentBranch = await this._gitService.getCurrentBranch();
            console.log('Current branch from git:', currentBranch, 'Selected branch:', this._selectedBranch);
            
            if (!this._selectedBranch || this._selectedBranch === currentBranch) {
                hasUncommittedChanges = await this._gitService.hasUncommittedChanges();
                console.log('Uncommitted changes detected:', hasUncommittedChanges);
            }

            // Send data to WebView for content update
            console.log('Sending data to WebView:', { branches: branches.length, commits: commits.length, hasUncommittedChanges });
            this._panel.webview.postMessage({
                command: 'updateContent',
                branches: branches,
                commits: commits,
                hasUncommittedChanges: hasUncommittedChanges,
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
            const jsPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', file));
            return `<script src="${jsPath}"></script>`;
        }).join('\n    ');

        // Inject CSS and JS paths
        htmlContent = htmlContent.replace('<!-- CSS_PLACEHOLDER -->', `<link href="${cssPath}" rel="stylesheet">`);
        htmlContent = htmlContent.replace('<!-- Load JavaScript modules in correct order -->', jsScripts);
        
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

    private async _handleGetCommitDetails(hash: string, compareAgainst?: string, compareBranch?: string) {
        try {
            console.log('Getting commit details for:', hash, 'compareAgainst:', compareAgainst, 'compareBranch:', compareBranch);
            
            let commit;
            if (compareAgainst === 'branch' && compareBranch) {
                // Get commit details with branch comparison
                commit = await this._gitService.getCommitDetailsWithCompare(hash, compareBranch);
            } else if (compareAgainst === 'working') {
                // Get commit details with working directory comparison
                commit = await this._gitService.getCommitDetailsWithWorking(hash);
            } else {
                // Default: compare against previous commit
                commit = await this._gitService.getCommitDetails(hash);
            }
            
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

    private async _handleGetMultiCommitFiles(hashes: string[], compareAgainst?: string, compareBranch?: string) {
        try {
            console.log('Getting multi-commit files for:', hashes, 'compareAgainst:', compareAgainst, 'compareBranch:', compareBranch);
            
            let files;
            if (compareAgainst === 'branch' && compareBranch) {
                // Get multi-commit files with branch comparison
                files = await this._gitService.getMultiCommitFilesWithCompare(hashes, compareBranch);
            } else if (compareAgainst === 'working') {
                // Get multi-commit files with working directory comparison
                files = await this._gitService.getMultiCommitFilesWithWorking(hashes);
            } else {
                // Default: compare against previous commits
                files = await this._gitService.getMultiCommitFiles(hashes);
            }
            
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
         let diffContent = '';
         
         if (commitHash) {
           // Show diff between commit and its parent
           diffContent = await this._gitService.getFileDiff(commitHash, filePath);
           
           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} in commit ${commitHash.substring(0, 7)}`);
             return;
           }
         } else {
           // Show current working directory changes
           diffContent = await this._gitService.getFileDiff('HEAD', filePath);
           
           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} in working directory`);
             return;
           }
         }
         
         // Send the diff content to the webview instead of creating temporary files
         this._panel.webview.postMessage({
           command: 'updateFileDiff',
           file: filePath,
           diff: diffContent
         });
         
         vscode.window.setStatusBarMessage(`Showing diff for ${filePath}`, 5000);
         
       } catch (err) {
         console.error('Error showing file diff:', err);
         vscode.window.showErrorMessage(`Failed to show file diff: ${String(err)}`);
       }
     }

     private async _handleShowMultiCommitFileDiff(filePath: string, commitHashes: string[]) {
       try {
         const ws = vscode.workspace.workspaceFolders?.[0];
         if (!ws) {
           vscode.window.showErrorMessage('No workspace folder found');
           return;
         }

         if (!commitHashes || commitHashes.length === 0) {
           vscode.window.showErrorMessage('No commits selected');
           return;
         }

         // Sort commits chronologically (oldest first)
         const sortedCommits = commitHashes.sort();
         const firstCommit = sortedCommits[0];
         const lastCommit = sortedCommits[sortedCommits.length - 1];

         // Get the diff content for the range
         const diffContent = await this._gitService.getFileDiff(`${firstCommit}~1..${lastCommit}`, filePath);
         
         if (!diffContent || diffContent.trim() === '') {
           vscode.window.showInformationMessage(`No changes found for ${filePath} in selected commits`);
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

         vscode.window.setStatusBarMessage(`Diff for ${filePath} (${commitHashes.length} commits)`, 5000);

       } catch (err) {
         console.error('Error showing multi-commit file diff:', err);
         vscode.window.showErrorMessage(`Failed to show file diff: ${String(err)}`);
       }
     }

     private async _handleShowFileDiffWithCompare(filePath: string, compareData: any) {
       try {
         const ws = vscode.workspace.workspaceFolders?.[0];
         if (!ws) {
           vscode.window.showErrorMessage('No workspace folder found');
           return;
         }

         const { compareAgainst, selectedCommits, compareBranch } = compareData;

         switch (compareAgainst) {
           case 'previous':
             await this._handlePreviousCommitDiff(filePath, selectedCommits);
             break;
           case 'branch':
             if (!compareBranch) {
               vscode.window.showErrorMessage('Please select a branch to compare against');
               return;
             }
             await this._handleBranchDiff(filePath, selectedCommits, compareBranch);
             break;
           case 'working':
             await this._handleWorkingDirectoryDiff(filePath, selectedCommits);
             break;
           default:
             vscode.window.showErrorMessage('Invalid compare option');
         }

       } catch (err) {
         console.error('Error showing file diff with compare:', err);
         vscode.window.showErrorMessage(`Failed to show file diff: ${String(err)}`);
       }
     }

     private async _handlePreviousCommitDiff(filePath: string, selectedCommits: string[]) {
       if (selectedCommits.length === 1) {
         // Single commit - compare with its parent
         await this._handleShowFileDiff(filePath, selectedCommits[0]);
       } else if (selectedCommits.length > 1) {
         // Multiple commits - compare range with previous using VS Code's built-in diff
         const sortedCommits = selectedCommits.sort();
         const firstCommit = sortedCommits[0];
         const lastCommit = sortedCommits[sortedCommits.length - 1];
         
         // For multiple commits, show the diff range using git diff
         const diffContent = await this._gitService.getFileDiffRange(
           `${firstCommit}~1..${lastCommit}`,
           filePath
         );

         if (!diffContent || diffContent.trim() === '') {
           vscode.window.showInformationMessage(`No changes found for ${filePath} across ${selectedCommits.length} commits`);
           return;
         }

         // Show diff content in a read-only text document
         const diffDocument = await vscode.workspace.openTextDocument({
           content: diffContent,
           language: 'diff'
         });

         await vscode.window.showTextDocument(diffDocument, {
           viewColumn: vscode.ViewColumn.Beside,
           preview: true
         });

         vscode.window.setStatusBarMessage(`Diff for ${filePath} (${selectedCommits.length} commits)`, 5000);
       }
     }

     private async _handleBranchDiff(filePath: string, selectedCommits: string[], compareBranch: string) {
       try {
         const ws = vscode.workspace.workspaceFolders?.[0];
         if (!ws) {
           vscode.window.showErrorMessage('No workspace folder found');
           return;
         }

         if (selectedCommits.length === 1) {
           // Single commit - compare with branch using git diff
           const commitHash = selectedCommits[0];
           
           const diffContent = await this._gitService.getFileDiffRange(
             `${compareBranch}..${commitHash}`,
             filePath
           );

           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} between ${compareBranch} and ${commitHash.substring(0, 7)}`);
             return;
           }

           // Show diff content in a read-only text document
           const diffDocument = await vscode.workspace.openTextDocument({
             content: diffContent,
             language: 'diff'
           });

           await vscode.window.showTextDocument(diffDocument, {
             viewColumn: vscode.ViewColumn.Beside,
             preview: true
           });

           vscode.window.setStatusBarMessage(`Diff for ${filePath} (${compareBranch} vs ${commitHash.substring(0, 7)})`, 5000);

         } else if (selectedCommits.length > 1) {
           // Multiple commits - compare range with branch
           const sortedCommits = selectedCommits.sort();
           const lastCommit = sortedCommits[sortedCommits.length - 1];
           
           const diffContent = await this._gitService.getFileDiffRange(
             `${compareBranch}..${lastCommit}`,
             filePath
           );

           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} between ${compareBranch} and ${selectedCommits.length} commits`);
             return;
           }

           // Show diff content in a read-only text document
           const diffDocument = await vscode.workspace.openTextDocument({
             content: diffContent,
             language: 'diff'
           });

           await vscode.window.showTextDocument(diffDocument, {
             viewColumn: vscode.ViewColumn.Beside,
             preview: true
           });

           vscode.window.setStatusBarMessage(`Diff for ${filePath} (${compareBranch} vs ${selectedCommits.length} commits)`, 5000);
         }
       } catch (err) {
         console.error('Error showing branch diff:', err);
         vscode.window.showErrorMessage(`Failed to show file diff: ${String(err)}`);
       }
     }

     private async _handleWorkingDirectoryDiff(filePath: string, selectedCommits: string[]) {
       try {
         const ws = vscode.workspace.workspaceFolders?.[0];
         if (!ws) {
           vscode.window.showErrorMessage('No workspace folder found');
           return;
         }

         if (selectedCommits.length === 1) {
           // Single commit - compare with working directory using git diff
           const commitHash = selectedCommits[0];
           
           const diffContent = await this._gitService.getFileDiffRange(
             `${commitHash}..HEAD`,
             filePath
           );

           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} between ${commitHash.substring(0, 7)} and working directory`);
             return;
           }

           // Show diff content in a read-only text document
           const diffDocument = await vscode.workspace.openTextDocument({
             content: diffContent,
             language: 'diff'
           });

           await vscode.window.showTextDocument(diffDocument, {
             viewColumn: vscode.ViewColumn.Beside,
             preview: true
           });

           vscode.window.setStatusBarMessage(`Diff for ${filePath} (${commitHash.substring(0, 7)} vs working directory)`, 5000);

         } else if (selectedCommits.length > 1) {
           // Multiple commits - compare range with working directory
           const sortedCommits = selectedCommits.sort();
           const lastCommit = sortedCommits[sortedCommits.length - 1];
           
           const diffContent = await this._gitService.getFileDiffRange(
             `${lastCommit}..HEAD`,
             filePath
           );

           if (!diffContent || diffContent.trim() === '') {
             vscode.window.showInformationMessage(`No changes found for ${filePath} between ${selectedCommits.length} commits and working directory`);
             return;
           }

           // Show diff content in a read-only text document
           const diffDocument = await vscode.workspace.openTextDocument({
             content: diffContent,
             language: 'diff'
           });

           await vscode.window.showTextDocument(diffDocument, {
             viewColumn: vscode.ViewColumn.Beside,
             preview: true
           });

           vscode.window.setStatusBarMessage(`Diff for ${filePath} (${selectedCommits.length} commits vs working directory)`, 5000);
         }
       } catch (err) {
         console.error('Error showing working directory diff:', err);
         vscode.window.showErrorMessage(`Failed to show file diff: ${String(err)}`);
       }
     }

     private async _handleShowWorkingDirectoryChanges() {
       try {
         // Open the Source Control view to show working directory changes
         await vscode.commands.executeCommand('workbench.view.scm');
         vscode.window.setStatusBarMessage('Showing working directory changes', 3000);
       } catch (err) {
         console.error('Error showing working directory changes:', err);
         vscode.window.showErrorMessage(`Failed to show working directory changes: ${String(err)}`);
       }
     }

     private async _getWorkingDirectoryFileContent(filePath: string): Promise<string> {
       try {
         const ws = vscode.workspace.workspaceFolders?.[0];
         if (!ws) {
           return '';
         }

         const fileUri = vscode.Uri.joinPath(ws.uri, filePath);
         const document = await vscode.workspace.openTextDocument(fileUri);
         return document.getText();
       } catch (error) {
         console.error('Error reading working directory file:', error);
         return '';
       }
     }

     private _getLanguageFromFile(filePath: string): string {
       const extension = filePath.split('.').pop()?.toLowerCase();
       
       const languageMap: { [key: string]: string } = {
         'js': 'javascript',
         'ts': 'typescript',
         'jsx': 'javascriptreact',
         'tsx': 'typescriptreact',
         'py': 'python',
         'java': 'java',
         'cpp': 'cpp',
         'c': 'c',
         'cs': 'csharp',
         'php': 'php',
         'rb': 'ruby',
         'go': 'go',
         'rs': 'rust',
         'html': 'html',
         'css': 'css',
         'scss': 'scss',
         'sass': 'sass',
         'less': 'less',
         'json': 'json',
         'xml': 'xml',
         'yaml': 'yaml',
         'yml': 'yaml',
         'md': 'markdown',
         'sql': 'sql',
         'sh': 'shellscript',
         'bash': 'shellscript',
         'zsh': 'shellscript',
         'fish': 'shellscript',
         'ps1': 'powershell',
         'dockerfile': 'dockerfile',
         'dockerignore': 'ignore',
         'gitignore': 'ignore',
         'gitattributes': 'ignore'
       };
       
      return languageMap[extension || ''] || 'plaintext';
    }

    private async _handleShowEditableDiff(filePath: string, compareData: any) {
      try {
        const ws = vscode.workspace.workspaceFolders?.[0];
        if (!ws) {
          vscode.window.showErrorMessage('No workspace folder found');
          return;
        }

        const { compareAgainst, selectedCommits, compareBranch } = compareData;

        if (compareAgainst === 'previous') {
          await this._handleEditablePreviousCommitDiff(filePath, selectedCommits);
        } else if (compareAgainst === 'branch') {
          await this._handleEditableBranchDiff(filePath, selectedCommits, compareBranch);
        } else if (compareAgainst === 'working') {
          await this._handleEditableWorkingDirectoryDiff(filePath, selectedCommits);
        }
      } catch (err) {
        console.error('Error showing editable diff:', err);
        vscode.window.showErrorMessage(`Failed to show editable diff: ${String(err)}`);
      }
    }

    private async _handleEditablePreviousCommitDiff(filePath: string, selectedCommits: string[]) {
      if (selectedCommits.length === 1) {
        // Single commit - create editable diff with temporary documents
        const ws = vscode.workspace.workspaceFolders?.[0];
        if (!ws) return;
        
        const commitHash = selectedCommits[0];
        
        // Get the file content at the commit and its parent
        const [commitContent, parentContent] = await Promise.all([
          this._gitService.getFileContentAtCommit(commitHash, filePath),
          this._gitService.getFileContentAtCommit(`${commitHash}~1`, filePath)
        ]);
        
        // Create temporary documents for the diff
        const commitDoc = await vscode.workspace.openTextDocument({
          content: commitContent || '',
          language: this._getLanguageFromFile(filePath)
        });
        
        const parentDoc = await vscode.workspace.openTextDocument({
          content: parentContent || '',
          language: this._getLanguageFromFile(filePath)
        });
        
        // Show the diff using VS Code's built-in diff viewer in editable mode
        await vscode.commands.executeCommand(
          'vscode.diff',
          parentDoc.uri,
          commitDoc.uri,
          `${filePath} (${commitHash.substring(0, 7)})`,
          {
            viewColumn: vscode.ViewColumn.Beside
          }
        );
      } else {
        // Multiple commits - show diff range
        const sortedCommits = selectedCommits.sort();
        const firstCommit = sortedCommits[0];
        const lastCommit = sortedCommits[sortedCommits.length - 1];
        
        const diffContent = await this._gitService.getFileDiffRange(
          `${firstCommit}~1..${lastCommit}`,
          filePath
        );

        if (!diffContent || diffContent.trim() === '') {
          vscode.window.showInformationMessage(`No changes found for ${filePath} across ${selectedCommits.length} commits`);
          return;
        }

        // Show diff content in an editable text document
        const diffDocument = await vscode.workspace.openTextDocument({
          content: diffContent,
          language: 'diff'
        });

        await vscode.window.showTextDocument(diffDocument, {
          viewColumn: vscode.ViewColumn.Beside
        });
      }
    }

    private async _handleEditableBranchDiff(filePath: string, selectedCommits: string[], compareBranch: string) {
      const sortedCommits = selectedCommits.sort();
      const lastCommit = sortedCommits[sortedCommits.length - 1];
      
      if (selectedCommits.length === 1) {
        // Single commit - create editable diff with temporary documents
        const [commitContent, branchContent] = await Promise.all([
          this._gitService.getFileContentAtCommit(lastCommit, filePath),
          this._gitService.getFileContentAtCommit(compareBranch, filePath)
        ]);

        // Create temporary documents for the diff
        const commitDoc = await vscode.workspace.openTextDocument({
          content: commitContent || '',
          language: this._getLanguageFromFile(filePath)
        });

        const branchDoc = await vscode.workspace.openTextDocument({
          content: branchContent || '',
          language: this._getLanguageFromFile(filePath)
        });

        // Show the diff using VS Code's built-in diff viewer in editable mode
        await vscode.commands.executeCommand(
          'vscode.diff',
          branchDoc.uri,
          commitDoc.uri,
          `${filePath} (${compareBranch} vs ${lastCommit.substring(0, 7)})`,
          {
            viewColumn: vscode.ViewColumn.Beside
          }
        );
      } else {
        // Multiple commits - show diff range
        const diffContent = await this._gitService.getFileDiffRange(
          `${compareBranch}..${lastCommit}`,
          filePath
        );

        if (!diffContent || diffContent.trim() === '') {
          vscode.window.showInformationMessage(`No changes found for ${filePath} between ${compareBranch} and ${selectedCommits.length} commits`);
          return;
        }

        // Show diff content in an editable text document
        const diffDocument = await vscode.workspace.openTextDocument({
          content: diffContent,
          language: 'diff'
        });

        await vscode.window.showTextDocument(diffDocument, {
          viewColumn: vscode.ViewColumn.Beside
        });
      }
    }

    private async _handleEditableWorkingDirectoryDiff(filePath: string, selectedCommits: string[]) {
      const sortedCommits = selectedCommits.sort();
      const lastCommit = sortedCommits[sortedCommits.length - 1];
      
      if (selectedCommits.length === 1) {
        // Single commit - create editable diff with temporary documents
        const [commitContent, workingContent] = await Promise.all([
          this._gitService.getFileContentAtCommit(lastCommit, filePath),
          this._getWorkingDirectoryFileContent(filePath)
        ]);

        // Create temporary documents for the diff
        const commitDoc = await vscode.workspace.openTextDocument({
          content: commitContent || '',
          language: this._getLanguageFromFile(filePath)
        });

        const workingDoc = await vscode.workspace.openTextDocument({
          content: workingContent || '',
          language: this._getLanguageFromFile(filePath)
        });

        // Show the diff using VS Code's built-in diff viewer in editable mode
        await vscode.commands.executeCommand(
          'vscode.diff',
          commitDoc.uri,
          workingDoc.uri,
          `${filePath} (${lastCommit.substring(0, 7)} vs working directory)`,
          {
            viewColumn: vscode.ViewColumn.Beside
          }
        );
      } else {
        // Multiple commits - show diff range
        const diffContent = await this._gitService.getFileDiffRange(
          `${lastCommit}..HEAD`,
          filePath
        );

        if (!diffContent || diffContent.trim() === '') {
          vscode.window.showInformationMessage(`No changes found for ${filePath} between ${selectedCommits.length} commits and working directory`);
          return;
        }

        // Show diff content in an editable text document
        const diffDocument = await vscode.workspace.openTextDocument({
          content: diffContent,
          language: 'diff'
        });

        await vscode.window.showTextDocument(diffDocument, {
          viewColumn: vscode.ViewColumn.Beside
        });
      }
    }

    private async _handleOpenWorkingFile(filePath: string) {
      try {
        const ws = vscode.workspace.workspaceFolders?.[0];
        if (!ws) {
          vscode.window.showErrorMessage('No workspace folder found');
          return;
        }

        const fileUri = vscode.Uri.joinPath(ws.uri, filePath);
        await vscode.window.showTextDocument(fileUri, {
          viewColumn: vscode.ViewColumn.Beside
        });
      } catch (err) {
        console.error('Error opening working file:', err);
        vscode.window.showErrorMessage(`Failed to open file: ${String(err)}`);
      }
    }

    private async _handleGetCommitsWithCompare(branch: string, compareBranch: string) {
        try {
            console.log('Getting commits for branch:', branch, 'excluding:', compareBranch);
            let commits;
            
            if (compareBranch && compareBranch !== 'none') {
                // Get commits that are in the branch but not in the compare branch
                commits = await this._gitService.getCommitsExcludingBranch(branch, compareBranch);
            } else {
                // Get all commits for the branch
                commits = await this._gitService.getCommits(branch);
            }

            console.log('Loaded commits with compare:', commits.length);
            
            // Send commits back to WebView
            this._panel.webview.postMessage({
                command: 'updateCommitsWithCompare',
                commits: commits,
                branch: branch,
                compareBranch: compareBranch
            });
        } catch (error) {
            console.error('Error getting commits with compare:', error);
            this._panel.webview.postMessage({
                command: 'updateCommitsWithCompare',
                commits: [],
                branch: branch,
                compareBranch: compareBranch,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async _handleRevealFileInExplorer(filePath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            await vscode.commands.executeCommand('revealFileInOS', uri);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to reveal file: ${error}`);
        }
    }

    private async _handleRevealDirectoryInExplorer(directoryName: string): Promise<void> {
        try {
            // For directories, we'll try to find the full path
            // This is a simplified implementation - you might want to enhance this
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, directoryName);
                await vscode.commands.executeCommand('revealFileInOS', uri);
            } else {
                vscode.window.showErrorMessage('No workspace folder found');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to reveal directory: ${error}`);
        }
    }

    private async _handleCheckoutBranch(branchName: string): Promise<void> {
        try {
            const success = await this._gitService.checkoutBranch(branchName);
            if (success) {
                vscode.window.showInformationMessage(`Switched to branch: ${branchName}`);
                await this.refresh();
            } else {
                vscode.window.showErrorMessage(`Failed to checkout branch: ${branchName}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error checking out branch: ${error}`);
        }
    }

    private async _handleMergeBranch(branchName: string): Promise<void> {
        try {
            const success = await this._gitService.mergeBranch(branchName);
            if (success) {
                vscode.window.showInformationMessage(`Merged ${branchName} into current branch`);
                await this.refresh();
            } else {
                vscode.window.showErrorMessage(`Failed to merge branch: ${branchName}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error merging branch: ${error}`);
        }
    }

    private async _handleDeleteBranch(branchName: string): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete branch "${branchName}"?`,
            { modal: true },
            'Delete'
        );

        if (confirm === 'Delete') {
            try {
                const success = await this._gitService.deleteBranch(branchName, true);
                if (success) {
                    vscode.window.showInformationMessage(`Deleted branch: ${branchName}`);
                    await this.refresh();
                } else {
                    vscode.window.showErrorMessage(`Failed to delete branch: ${branchName}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error deleting branch: ${error}`);
            }
        }
    }

    private async _handleCreateBranchFromCommit(commitHash: string): Promise<void> {
        const branchName = await vscode.window.showInputBox({
            prompt: 'Enter new branch name',
            placeHolder: 'new-branch-name',
            value: `feature/${commitHash.substring(0, 7)}`
        });

        if (branchName) {
            try {
                const success = await this._gitService.createBranch(branchName, commitHash);
                if (success) {
                    vscode.window.showInformationMessage(`Created branch: ${branchName}`);
                    await this.refresh();
                } else {
                    vscode.window.showErrorMessage(`Failed to create branch: ${branchName}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating branch: ${error}`);
            }
        }
    }

    private async _handleCherryPickCommit(commitHash: string): Promise<void> {
        try {
            const success = await this._gitService.cherryPickCommit(commitHash);
            if (success) {
                vscode.window.showInformationMessage(`Cherry picked commit: ${commitHash.substring(0, 7)}`);
                await this.refresh();
            } else {
                vscode.window.showErrorMessage(`Failed to cherry pick commit: ${commitHash.substring(0, 7)}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error cherry picking commit: ${error}`);
        }
    }

    private async _handleRevertCommit(commitHash: string): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to revert commit "${commitHash.substring(0, 7)}"?`,
            { modal: true },
            'Revert'
        );

        if (confirm === 'Revert') {
            try {
                const success = await this._gitService.revertCommit(commitHash);
                if (success) {
                    vscode.window.showInformationMessage(`Reverted commit: ${commitHash.substring(0, 7)}`);
                    await this.refresh();
                } else {
                    vscode.window.showErrorMessage(`Failed to revert commit: ${commitHash.substring(0, 7)}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error reverting commit: ${error}`);
            }
        }
    }

    private async _handleGetUncommittedChanges(): Promise<void> {
        try {
            const files = await this._gitService.getUncommittedChanges();
            this._panel.webview.postMessage({
                command: 'commitDetails',
                commit: null,
                files: files
            });
        } catch (error) {
            console.error('Error getting uncommitted changes:', error);
            vscode.window.showErrorMessage(`Failed to get uncommitted changes: ${error}`);
        }
    }

    private async _handleCommitChanges(message: string): Promise<void> {
        try {
            const success = await this._gitService.commitChanges(message);
            if (success) {
                vscode.window.showInformationMessage(`Committed changes: ${message}`);
                await this.refresh();
            } else {
                vscode.window.showErrorMessage(`Failed to commit changes`);
            }
        } catch (error) {
            console.error('Error committing changes:', error);
            vscode.window.showErrorMessage(`Error committing changes: ${error}`);
        }
    }

    private async _handleOpenFile(fileName: string): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(fileName);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            console.error('Error opening file:', error);
            vscode.window.showErrorMessage(`Error opening file: ${error}`);
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
