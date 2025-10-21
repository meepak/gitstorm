import * as vscode from 'vscode';
import { GitStormPanel } from '../core/GitStormPanel';

export class StashHandler {
    constructor(private readonly panel: GitStormPanel) {}

    async handleSelectStash(stashName: string): Promise<void> {
        try {
            console.log('Selecting stash:', stashName);
            
            // Get stash files
            const files = await this.panel.gitService.getStashFiles(stashName);
            
            // Send stash details to the webview
            this.panel.panel.webview.postMessage({
                command: 'stashDetails',
                stashName,
                files
            });
        } catch (error) {
            console.error('Error selecting stash:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to select stash'
            });
        }
    }

    async handleApplyStash(stashName: string): Promise<void> {
        try {
            console.log('Applying stash:', stashName);
            await this.panel.gitService.applyStash(stashName);
            
            // Refresh the panel after applying
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Applied stash: ${stashName}`
            });
        } catch (error) {
            console.error('Error applying stash:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to apply stash'
            });
        }
    }

    async handlePopStash(stashName: string): Promise<void> {
        try {
            console.log('Popping stash:', stashName);
            await this.panel.gitService.popStash(stashName);
            
            // Refresh the panel after popping
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Popped stash: ${stashName}`
            });
        } catch (error) {
            console.error('Error popping stash:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to pop stash'
            });
        }
    }

    async handleDropStash(stashName: string): Promise<void> {
        try {
            console.log('Dropping stash:', stashName);
            
            // Show confirmation dialog
            const confirmation = await vscode.window.showWarningMessage(
                `Are you sure you want to drop ${stashName}? This action cannot be undone.`,
                { modal: true },
                'Drop'
            );
            
            if (confirmation !== 'Drop') {
                return;
            }
            
            await this.panel.gitService.dropStash(stashName);
            
            // Refresh the panel after dropping
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Dropped stash: ${stashName}`
            });
        } catch (error) {
            console.error('Error dropping stash:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to drop stash'
            });
        }
    }

    async handleCreateBranchFromStash(stashName: string): Promise<void> {
        try {
            console.log('Creating branch from stash:', stashName);
            
            // Prompt user for branch name
            const branchName = await vscode.window.showInputBox({
                prompt: 'Enter branch name',
                placeHolder: 'new-branch-name'
            });
            
            if (!branchName) {
                return;
            }
            
            await this.panel.gitService.createBranchFromStash(stashName, branchName);
            
            // Refresh the panel after creating branch
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Created branch: ${branchName} from ${stashName}`
            });
        } catch (error) {
            console.error('Error creating branch from stash:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to create branch from stash'
            });
        }
    }

    async handleShowStashDiff(stashName: string, filePath: string): Promise<void> {
        try {
            console.log('Showing stash diff for file:', filePath, 'in stash:', stashName);
            
            // Get the stash diff for the specific file
            const diff = await this.panel.gitService.getFileDiff(stashName, filePath);
            
            // Open the diff in VS Code
            const uri = vscode.Uri.parse(`gitstorm-diff:${filePath}?stash=${stashName}`);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            console.error('Error showing stash diff:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show stash diff'
            });
        }
    }
}

