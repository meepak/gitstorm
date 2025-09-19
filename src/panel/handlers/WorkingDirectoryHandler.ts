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
