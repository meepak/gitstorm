import * as vscode from 'vscode';
import { GitService, Branch, Commit } from './gitService';

export class ContextMenuService {
    private _gitService: GitService;

    constructor(gitService: GitService) {
        this._gitService = gitService;
    }

    async showBranchContextMenu(branch: Branch, webview: vscode.Webview): Promise<void> {
        const items: vscode.QuickPickItem[] = [];

        if (!branch.isCurrent) {
            items.push({
                label: '$(git-branch) Checkout',
                description: `Switch to ${branch.name}`,
                detail: 'Checkout this branch'
            });
        }

        items.push({
            label: '$(plus) Create Branch From',
            description: `Create new branch from ${branch.name}`,
            detail: 'Create a new branch starting from this branch'
        });

        if (branch.isLocal && !branch.isCurrent) {
            items.push({
                label: '$(trash) Delete Branch',
                description: `Delete ${branch.name}`,
                detail: 'Delete this local branch'
            });
        }

        if (!branch.isCurrent) {
            items.push({
                label: '$(git-merge) Merge',
                description: `Merge ${branch.name} into current`,
                detail: 'Merge this branch into the current branch'
            });

            items.push({
                label: '$(git-compare) Compare',
                description: `Compare with ${branch.name}`,
                detail: 'Show commits and changes between branches'
            });
        }

        items.push({
            label: '$(sync) Fetch/Update',
            description: 'Fetch latest changes',
            detail: 'Fetch updates from remote'
        });

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Actions for branch: ${branch.name}`,
            title: 'Branch Actions'
        });

        if (selection) {
            await this.handleBranchAction(selection.label, branch, webview);
        }
    }

    async showCommitContextMenu(commit: Commit, webview: vscode.Webview): Promise<void> {
        const items: vscode.QuickPickItem[] = [
            {
                label: '$(git-branch) Create Branch',
                description: `Create branch from ${commit.shortHash}`,
                detail: 'Create a new branch starting from this commit'
            },
            {
                label: '$(tag) Create Tag',
                description: `Tag ${commit.shortHash}`,
                detail: 'Create a tag at this commit'
            },
            {
                label: '$(git-compare) Cherry Pick',
                description: `Cherry pick ${commit.shortHash}`,
                detail: 'Apply this commit to the current branch'
            },
            {
                label: '$(undo) Revert',
                description: `Revert ${commit.shortHash}`,
                detail: 'Create a commit that undoes this commit'
            },
            {
                label: '$(eye) View Details',
                description: 'Show full commit information',
                detail: 'View detailed commit information and changes'
            }
        ];

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Actions for commit: ${commit.shortHash}`,
            title: 'Commit Actions'
        });

        if (selection) {
            await this.handleCommitAction(selection.label, commit, webview);
        }
    }

    private async handleBranchAction(action: string, branch: Branch, webview: vscode.Webview): Promise<void> {
        switch (action) {
            case '$(git-branch) Checkout':
                await this.checkoutBranch(branch.name, webview);
                break;
            case '$(plus) Create Branch From':
                await this.createBranchFrom(branch.name);
                break;
            case '$(trash) Delete Branch':
                await this.deleteBranch(branch.name);
                break;
            case '$(git-merge) Merge':
                await this.mergeBranch(branch.name, webview);
                break;
            case '$(git-compare) Compare':
                await this.compareBranches(branch.name, webview);
                break;
            case '$(sync) Fetch/Update':
                await this.fetchUpdates();
                break;
        }
    }

    private async handleCommitAction(action: string, commit: Commit, webview: vscode.Webview): Promise<void> {
        switch (action) {
            case '$(git-branch) Create Branch':
                await this.createBranchFromCommit(commit);
                break;
            case '$(tag) Create Tag':
                await this.createTag(commit);
                break;
            case '$(git-compare) Cherry Pick':
                await this.cherryPickCommit(commit, webview);
                break;
            case '$(undo) Revert':
                await this.revertCommit(commit, webview);
                break;
            case '$(eye) View Details':
                await this.viewCommitDetails(commit, webview);
                break;
        }
    }

    private async checkoutBranch(branchName: string, webview: vscode.Webview): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Checking out ${branchName}...`,
                cancellable: false
            }, async () => {
                const success = await this._gitService.checkoutBranch(branchName);
                if (success) {
                    vscode.window.showInformationMessage(`Switched to branch: ${branchName}`);
                    webview.postMessage({ command: 'refresh' });
                } else {
                    vscode.window.showErrorMessage(`Failed to checkout branch: ${branchName}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error checking out branch: ${error}`);
        }
    }

    private async createBranchFrom(branchName: string): Promise<void> {
        const newBranchName = await vscode.window.showInputBox({
            prompt: 'Enter new branch name',
            placeHolder: 'new-branch-name',
            value: `feature/${branchName}`
        });

        if (newBranchName) {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating branch ${newBranchName} from ${branchName}...`,
                    cancellable: false
                }, async () => {
                    const success = await this._gitService.createBranch(newBranchName, branchName);
                    if (success) {
                        vscode.window.showInformationMessage(`Created branch: ${newBranchName}`);
                    } else {
                        vscode.window.showErrorMessage(`Failed to create branch: ${newBranchName}`);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating branch: ${error}`);
            }
        }
    }

    private async deleteBranch(branchName: string): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete branch "${branchName}"?`,
            { modal: true },
            'Delete'
        );

        if (confirm === 'Delete') {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Deleting branch ${branchName}...`,
                    cancellable: false
                }, async () => {
                    const success = await this._gitService.deleteBranch(branchName, true);
                    if (success) {
                        vscode.window.showInformationMessage(`Deleted branch: ${branchName}`);
                    } else {
                        vscode.window.showErrorMessage(`Failed to delete branch: ${branchName}`);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error deleting branch: ${error}`);
            }
        }
    }

    private async mergeBranch(branchName: string, webview: vscode.Webview): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Merging ${branchName}...`,
                cancellable: false
            }, async () => {
                const success = await this._gitService.mergeBranch(branchName);
                if (success) {
                    vscode.window.showInformationMessage(`Merged ${branchName} into current branch`);
                    webview.postMessage({ command: 'refresh' });
                } else {
                    vscode.window.showErrorMessage(`Failed to merge branch: ${branchName}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error merging branch: ${error}`);
        }
    }

    private async compareBranches(branchName: string, webview: vscode.Webview): Promise<void> {
        // This would show a comparison view
        vscode.window.showInformationMessage(`Compare functionality with ${branchName} - Coming soon!`);
    }

    private async fetchUpdates(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Fetching updates...',
                cancellable: false
            }, async () => {
                // This would fetch from remote
                vscode.window.showInformationMessage('Fetch completed');
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching updates: ${error}`);
        }
    }

    private async createBranchFromCommit(commit: Commit): Promise<void> {
        const branchName = await vscode.window.showInputBox({
            prompt: 'Enter new branch name',
            placeHolder: 'new-branch-name',
            value: `feature/${commit.shortHash}`
        });

        if (branchName) {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Creating branch ${branchName} from ${commit.shortHash}...`,
                    cancellable: false
                }, async () => {
                    const success = await this._gitService.createBranch(branchName, commit.hash);
                    if (success) {
                        vscode.window.showInformationMessage(`Created branch: ${branchName}`);
                    } else {
                        vscode.window.showErrorMessage(`Failed to create branch: ${branchName}`);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating branch: ${error}`);
            }
        }
    }

    private async createTag(commit: Commit): Promise<void> {
        const tagName = await vscode.window.showInputBox({
            prompt: 'Enter tag name',
            placeHolder: 'v1.0.0'
        });

        if (tagName) {
            vscode.window.showInformationMessage(`Tag functionality - Coming soon!`);
        }
    }

    private async cherryPickCommit(commit: Commit, webview: vscode.Webview): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Cherry picking ${commit.shortHash}...`,
                cancellable: false
            }, async () => {
                const success = await this._gitService.cherryPickCommit(commit.hash);
                if (success) {
                    vscode.window.showInformationMessage(`Cherry picked commit: ${commit.shortHash}`);
                    webview.postMessage({ command: 'refresh' });
                } else {
                    vscode.window.showErrorMessage(`Failed to cherry pick commit: ${commit.shortHash}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error cherry picking commit: ${error}`);
        }
    }

    private async revertCommit(commit: Commit, webview: vscode.Webview): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to revert commit "${commit.shortHash}"?`,
            { modal: true },
            'Revert'
        );

        if (confirm === 'Revert') {
            try {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Reverting ${commit.shortHash}...`,
                    cancellable: false
                }, async () => {
                    const success = await this._gitService.revertCommit(commit.hash);
                    if (success) {
                        vscode.window.showInformationMessage(`Reverted commit: ${commit.shortHash}`);
                        webview.postMessage({ command: 'refresh' });
                    } else {
                        vscode.window.showErrorMessage(`Failed to revert commit: ${commit.shortHash}`);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error reverting commit: ${error}`);
            }
        }
    }

    private async viewCommitDetails(commit: Commit, webview: vscode.Webview): Promise<void> {
        // Show detailed commit information in a new editor
        const content = `Commit: ${commit.hash}
Author: ${commit.author}
Date: ${commit.date.toLocaleString()}
Message: ${commit.message}

Parents: ${commit.parents.join(', ')}
Refs: ${commit.refs.join(', ')}`;

        const doc = await vscode.workspace.openTextDocument({
            content,
            language: 'plaintext'
        });

        await vscode.window.showTextDocument(doc);
    }
}
