import * as vscode from 'vscode';
import { GitService } from './gitService';
import { GitStormPanel } from './gitStormPanel';

let gitService: GitService;

export function activate(context: vscode.ExtensionContext) {
    console.log('GitStorm extension is now active!');

    // Check if we have a workspace folder
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        console.log('No workspace folder found. GitStorm will be available when a workspace is opened.');
        return;
    }

    // Initialize Git service
    gitService = new GitService();

    // Register commands
    const openPanelCommand = vscode.commands.registerCommand('gitstorm.openPanel', () => {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Please open a workspace folder first.');
            return;
        }
        GitStormPanel.createOrShow(context.extensionUri, gitService);
    });

    const refreshCommand = vscode.commands.registerCommand('gitstorm.refresh', () => {
        GitStormPanel.currentPanel?.refresh();
    });

    context.subscriptions.push(openPanelCommand, refreshCommand);

    // Auto-open panel if workspace has git repository
    gitService.isGitRepository().then(isGit => {
        if (isGit) {
            GitStormPanel.createOrShow(context.extensionUri, gitService);
        }
    }).catch(error => {
        console.log('Error checking git repository:', error);
    });
}

export function deactivate() {
    if (gitService) {
        gitService.dispose();
    }
}
