import * as vscode from 'vscode';
import * as path from 'path';
import { GitStormPanel } from '../core/GitStormPanel';

export class FileHandler {
    constructor(private readonly panel: GitStormPanel) {}

    async handleShowFileDiff(filePath: string, commitHash?: string, parentIndex = 1, compareAgainst?: string, compareBranch?: string) {
        try {
            console.log('🚀🚀🚀 UPDATED FileHandler.handleShowFileDiff called for:', filePath, 'commit:', commitHash, 'compareAgainst:', compareAgainst, 'compareBranch:', compareBranch);
            console.log('🚀🚀🚀 All parameters received:', { filePath, commitHash, parentIndex, compareAgainst, compareBranch });
            
            // Route to appropriate method based on comparison mode
            if (compareAgainst === 'working' && commitHash) {
                await this.handleShowFileDiffWithWorking(filePath, commitHash);
                return;
            } else if (compareAgainst === 'branch' && commitHash) {
                await this.handleShowFileDiffWithBranch(filePath, commitHash, compareBranch);
                return;
            }
            
            // Default: compare against previous commit
            let diff;
            if (commitHash) {
                console.log('Getting diff for commit:', commitHash, 'file:', filePath);
                diff = await this.panel.gitService.getFileDiff(commitHash, filePath);
                console.log('Diff result length:', diff ? diff.length : 'null/undefined');
            } else {
                // Show working directory diff
                console.log('Getting working directory diff for file:', filePath);
                diff = await this.panel.gitService.getFileDiff('HEAD', filePath);
                console.log('Working diff result length:', diff ? diff.length : 'null/undefined');
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

    async handleShowFileDiffWithWorking(filePath: string, commitHash: string) {
        try {
            console.log('🚀🚀🚀 UPDATED FileHandler.handleShowFileDiffWithWorking called for:', filePath, 'commit:', commitHash);
            
            // Check if file exists in both the commit and the working directory
            const fileExistsInCommit = await this.panel.gitService.fileExistsAtCommit(commitHash, filePath);
            const fileExistsInWorking = await this.panel.gitService.fileExistsAtCommit('HEAD', filePath);
            
            console.log('File exists in commit:', fileExistsInCommit, 'File exists in working directory:', fileExistsInWorking);
            
            if (!fileExistsInCommit && !fileExistsInWorking) {
                // File doesn't exist in either, show empty diff
                this.panel.panel.webview.postMessage({
                    command: 'updateFileDiff',
                    file: filePath,
                    diff: ''
                });
                return;
            }
            
            // Get diff between commit and working directory
            const diff = await this.panel.gitService.getFileDiffRange(`${commitHash}..HEAD`, filePath);
            console.log('Working directory diff result length:', diff ? diff.length : 'null/undefined');
            
            this.panel.panel.webview.postMessage({
                command: 'updateFileDiff',
                file: filePath,
                diff: diff
            });
        } catch (error) {
            console.error('Error showing file diff with working directory:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show file diff with working directory'
            });
        }
    }

    async handleShowFileDiffWithBranch(filePath: string, commitHash: string, compareBranch?: string) {
        try {
            console.log('🚀🚀🚀 UPDATED FileHandler.handleShowFileDiffWithBranch called for:', filePath, 'commit:', commitHash, 'compareBranch:', compareBranch);
            
            // Use the specified compare branch, or default to current branch
            const branchForComparison = compareBranch || await this.panel.gitService.getCurrentBranch();
            console.log('Branch for comparison:', branchForComparison);
            
            // Check if file exists in both the commit and the comparison branch
            const fileExistsInCommit = await this.panel.gitService.fileExistsAtCommit(commitHash, filePath);
            const fileExistsInBranch = await this.panel.gitService.fileExistsAtCommit(branchForComparison, filePath);
            
            console.log('File exists in commit:', fileExistsInCommit, 'File exists in branch:', fileExistsInBranch);
            
            if (!fileExistsInCommit && !fileExistsInBranch) {
                // File doesn't exist in either, show empty diff
                this.panel.panel.webview.postMessage({
                    command: 'updateFileDiff',
                    file: filePath,
                    diff: ''
                });
                return;
            }
            
            if (!fileExistsInCommit) {
                // File was added in the branch, show as new file
                const diff = await this.panel.gitService.getFileDiffRange(`${branchForComparison}..${commitHash}`, filePath);
                console.log('Branch diff result length (file added):', diff ? diff.length : 'null/undefined');
                
                this.panel.panel.webview.postMessage({
                    command: 'updateFileDiff',
                    file: filePath,
                    diff: diff
                });
                return;
            }
            
            if (!fileExistsInBranch) {
                // File was deleted in the branch, show as deleted file
                const diff = await this.panel.gitService.getFileDiffRange(`${branchForComparison}..${commitHash}`, filePath);
                console.log('Branch diff result length (file deleted):', diff ? diff.length : 'null/undefined');
                
                this.panel.panel.webview.postMessage({
                    command: 'updateFileDiff',
                    file: filePath,
                    diff: diff
                });
                return;
            }
            
            // File exists in both, get normal diff
            const diff = await this.panel.gitService.getFileDiffRange(`${branchForComparison}..${commitHash}`, filePath);
            console.log('Branch diff result length (file exists in both):', diff ? diff.length : 'null/undefined');
            
            this.panel.panel.webview.postMessage({
                command: 'updateFileDiff',
                file: filePath,
                diff: diff
            });
        } catch (error) {
            console.error('Error showing file diff with branch:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show file diff with branch'
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
