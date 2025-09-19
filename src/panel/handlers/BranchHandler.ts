import * as vscode from 'vscode';
import { GitStormPanel } from '../core/GitStormPanel';

export class BranchHandler {
    constructor(private readonly panel: GitStormPanel) {}

    async handleCheckoutBranch(branchName: string): Promise<void> {
        try {
            console.log('Checking out branch:', branchName);
            await this.panel.gitService.checkoutBranch(branchName);
            
            // Refresh the panel after checkout
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Switched to branch: ${branchName}`
            });
        } catch (error) {
            console.error('Error checking out branch:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to checkout branch'
            });
        }
    }

    async handleMergeBranch(branchName: string): Promise<void> {
        try {
            console.log('Merging branch:', branchName);
            await this.panel.gitService.mergeBranch(branchName);
            
            // Refresh the panel after merge
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Merged branch: ${branchName}`
            });
        } catch (error) {
            console.error('Error merging branch:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to merge branch'
            });
        }
    }

    async handleDeleteBranch(branchName: string): Promise<void> {
        try {
            console.log('Deleting branch:', branchName);
            await this.panel.gitService.deleteBranch(branchName);
            
            // Refresh the panel after deletion
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Deleted branch: ${branchName}`
            });
        } catch (error) {
            console.error('Error deleting branch:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to delete branch'
            });
        }
    }

    async handleCreateBranchFromCommit(commitHash: string): Promise<void> {
        try {
            console.log('Creating branch from commit:', commitHash);
            
            // Prompt user for branch name
            const branchName = await vscode.window.showInputBox({
                prompt: 'Enter branch name',
                placeHolder: 'new-branch-name'
            });
            
            if (!branchName) {
                return;
            }
            
            await this.panel.gitService.createBranch(branchName, commitHash);
            
            // Refresh the panel after creating branch
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `Created branch: ${branchName}`
            });
        } catch (error) {
            console.error('Error creating branch from commit:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to create branch from commit'
            });
        }
    }
}
