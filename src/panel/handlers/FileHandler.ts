import * as vscode from 'vscode';
import * as path from 'path';
import { GitStormPanel } from '../core/GitStormPanel';

export class FileHandler {
    constructor(private readonly panel: GitStormPanel) {}

    async handleShowFileDiff(filePath: string, commitHash?: string, parentIndex = 1) {
        try {
            console.log('Showing file diff for:', filePath, 'commit:', commitHash, 'parentIndex:', parentIndex);
            
            let diff;
            if (commitHash) {
                diff = await this.panel.gitService.getFileDiff(commitHash, filePath);
            } else {
                // Show working directory diff
                diff = await this.panel.gitService.getFileDiff('HEAD', filePath);
            }
            
            this.panel.panel.webview.postMessage({
                command: 'updateFileDiff',
                file: filePath,
                diff: diff
            });
        } catch (error) {
            console.error('Error showing file diff:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show file diff'
            });
        }
    }

    async handleShowMultiCommitFileDiff(filePath: string, commitHashes: string[]) {
        try {
            console.log('Showing multi-commit file diff for:', filePath, 'commits:', commitHashes);
            
            // Get diff for each commit and combine them
            const diffs = await Promise.all(
                commitHashes.map(hash => this.panel.gitService.getFileDiff(hash, filePath))
            );
            
            const combinedDiff = diffs.join('\n---\n');
            
            this.panel.panel.webview.postMessage({
                command: 'updateFileDiff',
                file: filePath,
                diff: combinedDiff
            });
        } catch (error) {
            console.error('Error showing multi-commit file diff:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show multi-commit file diff'
            });
        }
    }

    async handleShowFileDiffWithCompare(filePath: string, compareData: any) {
        try {
            console.log('Showing file diff with compare for:', filePath, 'compareData:', compareData);
            
            let diff;
            switch (compareData.type) {
                case 'previous':
                    diff = await this.panel.gitService.getFileDiff(compareData.commitHash, filePath);
                    break;
                case 'branch':
                    diff = await this.panel.gitService.getFileDiffRange(
                        `${compareData.compareBranch}..${compareData.commitHash}`, 
                        filePath
                    );
                    break;
                case 'working':
                    diff = await this.panel.gitService.getFileDiff('HEAD', filePath);
                    break;
                default:
                    throw new Error(`Unknown compare type: ${compareData.type}`);
            }
            
            this.panel.panel.webview.postMessage({
                command: 'updateFileDiff',
                file: filePath,
                diff: diff
            });
        } catch (error) {
            console.error('Error showing file diff with compare:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show file diff with compare'
            });
        }
    }

    async handleShowEditableDiff(filePath: string, compareData: any) {
        try {
            console.log('Showing editable diff for:', filePath, 'compareData:', compareData);
            
            // This would open the file in VS Code's diff editor
            const fileUri = vscode.Uri.file(filePath);
            
            switch (compareData.type) {
                case 'previous':
                    // Show diff with previous commit
                    await this.showEditablePreviousCommitDiff(filePath, compareData.selectedCommits);
                    break;
                case 'branch':
                    // Show diff with branch
                    await this.showEditableBranchDiff(filePath, compareData.selectedCommits, compareData.compareBranch);
                    break;
                case 'working':
                    // Show diff with working directory
                    await this.showEditableWorkingDirectoryDiff(filePath, compareData.selectedCommits);
                    break;
                default:
                    throw new Error(`Unknown compare type: ${compareData.type}`);
            }
        } catch (error) {
            console.error('Error showing editable diff:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show editable diff'
            });
        }
    }

    async handleRevealFileInExplorer(filePath: string): Promise<void> {
        try {
            const fileUri = vscode.Uri.file(filePath);
            await vscode.commands.executeCommand('revealInExplorer', fileUri);
        } catch (error) {
            console.error('Error revealing file in explorer:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to reveal file in explorer'
            });
        }
    }

    async handleRevealDirectoryInExplorer(directoryName: string): Promise<void> {
        try {
            const directoryUri = vscode.Uri.file(directoryName);
            await vscode.commands.executeCommand('revealInExplorer', directoryUri);
        } catch (error) {
            console.error('Error revealing directory in explorer:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to reveal directory in explorer'
            });
        }
    }

    async handleOpenFile(fileName: string): Promise<void> {
        try {
            const fileUri = vscode.Uri.file(fileName);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            console.error('Error opening file:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to open file'
            });
        }
    }

    private async showEditablePreviousCommitDiff(filePath: string, selectedCommits: string[]) {
        // Implementation for showing editable diff with previous commit
        const fileUri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
    }

    private async showEditableBranchDiff(filePath: string, selectedCommits: string[], compareBranch: string) {
        // Implementation for showing editable diff with branch
        const fileUri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
    }

    private async showEditableWorkingDirectoryDiff(filePath: string, selectedCommits: string[]) {
        // Implementation for showing editable diff with working directory
        const fileUri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(fileUri);
        await vscode.window.showTextDocument(document);
    }
}
