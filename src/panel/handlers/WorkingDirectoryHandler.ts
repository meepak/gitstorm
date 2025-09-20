import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitStormPanel } from '../core/GitStormPanel';

export class WorkingDirectoryHandler {
    constructor(private readonly panel: GitStormPanel) {}

    async handleShowWorkingDirectoryChanges() {
        try {
            console.log('Showing working directory changes');
            const changes = await this.panel.gitService.getUncommittedChanges();
            
            this.panel.panel.webview.postMessage({
                command: 'commitDetails',
                commit: {
                    hash: 'WORKING_DIRECTORY',
                    shortHash: 'WORKING',
                    message: 'Uncommitted Changes',
                    author: 'Working Directory',
                    date: new Date(),
                    parents: [],
                    refs: [],
                    files: changes
                },
                files: changes
            });
        } catch (error) {
            console.error('Error showing working directory changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to show working directory changes'
            });
        }
    }

    async handleOpenWorkingFile(filePath: string) {
        try {
            console.log('Opening working file:', filePath);
            const fileUri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            console.error('Error opening working file:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to open working file'
            });
        }
    }

    async handleGetUncommittedChanges(): Promise<void> {
        try {
            console.log('Getting uncommitted changes');
            const changes = await this.panel.gitService.getUncommittedChanges();
            
            // Send both the commit details and update the uncommitted section
            this.panel.panel.webview.postMessage({
                command: 'commitDetails',
                commit: {
                    hash: 'WORKING_DIRECTORY',
                    shortHash: 'WORKING',
                    message: 'Uncommitted Changes',
                    author: 'Working Directory',
                    date: new Date(),
                    parents: [],
                    refs: [],
                    files: changes
                },
                files: changes
            });

            // Also send update for uncommitted changes section
            this.panel.panel.webview.postMessage({
                command: 'updateUncommittedChanges',
                files: changes
            });
        } catch (error) {
            console.error('Error getting uncommitted changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to get uncommitted changes'
            });
        }
    }

    async handleCommitChanges(message: string): Promise<void> {
        try {
            console.log('Committing changes with message:', message);
            await this.panel.gitService.commitChanges(message);
            
            // Refresh the panel after commit
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Changes committed successfully'
            });
        } catch (error) {
            console.error('Error committing changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to commit changes'
            });
        }
    }

    async handleGetStagedChanges(): Promise<void> {
        try {
            console.log('Getting staged changes');
            const changes = await this.panel.gitService.getStagedChanges();
            
            // Send update for staged changes section
            this.panel.panel.webview.postMessage({
                command: 'updateStagedChanges',
                files: changes
            });
        } catch (error) {
            console.error('Error getting staged changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to get staged changes'
            });
        }
    }

    async handleStageAllChanges(): Promise<void> {
        try {
            console.log('Staging all changes');
            await this.panel.gitService.stageAllChanges();
            
            // Refresh both uncommitted and staged changes
            await this.refreshWorkingChanges();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'All changes staged successfully'
            });
        } catch (error) {
            console.error('Error staging all changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to stage all changes'
            });
        }
    }

    async handleStageFile(filePath: string): Promise<void> {
        try {
            console.log('Staging file:', filePath);
            await this.panel.gitService.stageFile(filePath);
            
            // Refresh both uncommitted and staged changes
            await this.refreshWorkingChanges();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `File ${filePath} staged successfully`
            });
        } catch (error) {
            console.error('Error staging file:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to stage file'
            });
        }
    }

    async handleUnstageAllChanges(): Promise<void> {
        try {
            console.log('Unstaging all changes');
            await this.panel.gitService.unstageAllChanges();
            
            // Refresh both uncommitted and staged changes
            await this.refreshWorkingChanges();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'All changes unstaged successfully'
            });
        } catch (error) {
            console.error('Error unstaging all changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to unstage all changes'
            });
        }
    }

    async handleUnstageFile(filePath: string): Promise<void> {
        try {
            console.log('Unstaging file:', filePath);
            await this.panel.gitService.unstageFile(filePath);
            
            // Refresh both uncommitted and staged changes
            await this.refreshWorkingChanges();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `File ${filePath} unstaged successfully`
            });
        } catch (error) {
            console.error('Error unstaging file:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to unstage file'
            });
        }
    }

    async handleRevertFile(filePath: string): Promise<void> {
        try {
            console.log('Reverting file:', filePath);
            await this.panel.gitService.revertFile(filePath);
            
            // Refresh both uncommitted and staged changes
            await this.refreshWorkingChanges();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: `File ${filePath} reverted successfully`
            });
        } catch (error) {
            console.error('Error reverting file:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to revert file'
            });
        }
    }

    async handleStashChanges(message?: string): Promise<void> {
        try {
            console.log('Stashing changes with message:', message);
            await this.panel.gitService.stashChanges(message);
            
            // Refresh the panel after stashing
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Changes stashed successfully'
            });
        } catch (error) {
            console.error('Error stashing changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to stash changes'
            });
        }
    }

    async handleCommitStagedChanges(message: string): Promise<void> {
        try {
            console.log('Committing staged changes with message:', message);
            await this.panel.gitService.commitStagedChanges(message);
            
            // Refresh the panel after commit
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Staged changes committed successfully'
            });
        } catch (error) {
            console.error('Error committing staged changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to commit staged changes'
            });
        }
    }

    async handleCommitAndPushStagedChanges(message: string): Promise<void> {
        try {
            console.log('Committing and pushing staged changes with message:', message);
            await this.panel.gitService.commitAndPushStagedChanges(message);
            
            // Refresh the panel after commit and push
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Staged changes committed and pushed successfully'
            });
        } catch (error) {
            console.error('Error committing and pushing staged changes:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to commit and push staged changes'
            });
        }
    }

    async handlePushCommit(commitHash: string): Promise<void> {
        try {
            console.log('Pushing commit:', commitHash);
            await this.panel.gitService.pushCommit(commitHash);
            
            // Refresh the panel after push
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Commit pushed successfully'
            });
        } catch (error) {
            console.error('Error pushing commit:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to push commit'
            });
        }
    }

    private async refreshWorkingChanges(): Promise<void> {
        try {
            // Get both uncommitted and staged changes
            const [uncommittedChanges, stagedChanges] = await Promise.all([
                this.panel.gitService.getUncommittedChanges(),
                this.panel.gitService.getStagedChanges()
            ]);

            // Update both sections
            this.panel.panel.webview.postMessage({
                command: 'updateUncommittedChanges',
                files: uncommittedChanges
            });

            this.panel.panel.webview.postMessage({
                command: 'updateStagedChanges',
                files: stagedChanges
            });
        } catch (error) {
            console.error('Error refreshing uncommitted changes:', error);
        }
    }

    async getWorkingDirectoryFileContent(filePath: string): Promise<string> {
        try {
            const fileUri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            return document.getText();
        } catch (error) {
            console.error('Error reading working directory file:', error);
            return '';
        }
    }

    private getLanguageFromFile(filePath: string): string {
        const extension = path.extname(filePath).toLowerCase();
        
        const languageMap: { [key: string]: string } = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.r': 'r',
            '.m': 'objective-c',
            '.mm': 'objective-cpp',
            '.pl': 'perl',
            '.pm': 'perl',
            '.lua': 'lua',
            '.sh': 'shellscript',
            '.bash': 'shellscript',
            '.zsh': 'shellscript',
            '.fish': 'shellscript',
            '.ps1': 'powershell',
            '.psm1': 'powershell',
            '.bat': 'bat',
            '.cmd': 'bat',
            '.html': 'html',
            '.htm': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.toml': 'toml',
            '.ini': 'ini',
            '.cfg': 'ini',
            '.conf': 'ini',
            '.sql': 'sql',
            '.csv': 'csv',
            '.md': 'markdown',
            '.markdown': 'markdown',
            '.txt': 'plaintext',
            '.log': 'log',
            '.gitignore': 'ignore',
            '.gitattributes': 'gitattributes',
            '.dockerfile': 'dockerfile',
            '.makefile': 'makefile',
            '.readme': 'markdown'
        };
        
        return languageMap[extension] || 'plaintext';
    }
}
