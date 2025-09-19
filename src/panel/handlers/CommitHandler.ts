import * as vscode from 'vscode';
import { GitStormPanel } from '../core/GitStormPanel';
import { GitService } from '../../git/gitService';

export class CommitHandler {
    constructor(private readonly panel: GitStormPanel) {}

    async handleCommitSelection(hash: string) {
        console.log('Commit selected:', hash);
        // This is handled by the webview, no backend action needed
    }

    async handleSquashCommits(commitHashes: string[], message: string) {
        try {
            console.log('Squashing commits:', commitHashes, 'with message:', message);
            await this.panel.gitService.squashCommits(commitHashes, message);
            
            // Refresh the panel after squashing
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Commits squashed successfully'
            });
        } catch (error) {
            console.error('Error squashing commits:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to squash commits'
            });
        }
    }

    async handleGetCommitDetails(hash: string, compareAgainst?: string, compareBranch?: string) {
        try {
            console.log('Getting commit details for:', hash, 'compareAgainst:', compareAgainst, 'compareBranch:', compareBranch);
            
            let commit;
            if (compareAgainst === 'branch' && compareBranch) {
                // Get commit details with branch comparison
                commit = await this.panel.gitService.getCommitDetailsWithCompare(hash, compareBranch);
            } else if (compareAgainst === 'working') {
                // Get commit details with working directory comparison
                commit = await this.panel.gitService.getCommitDetailsWithWorking(hash);
            } else {
                // Default: compare against previous commit
                commit = await this.panel.gitService.getCommitDetails(hash);
            }
            
            if (commit) {
                console.log('Backend: Sending commitDetails with files:', commit.files?.length || 0);
                this.panel.panel.webview.postMessage({
                    command: 'commitDetails',
                    commit: commit,
                    files: commit.files || []
                });
            } else {
                console.log('Backend: Sending commitDetails with no commit - commit not found or invalid');
                this.panel.panel.webview.postMessage({
                    command: 'commitDetails',
                    commit: null,
                    files: []
                });
            }
        } catch (error) {
            console.error('Error getting commit details:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to get commit details'
            });
        }
    }

    async handleGetMultiCommitFiles(hashes: string[], compareAgainst?: string, compareBranch?: string) {
        try {
            console.log('Getting multi-commit files for:', hashes, 'compareAgainst:', compareAgainst, 'compareBranch:', compareBranch);
            
            let files;
            if (compareAgainst === 'branch' && compareBranch) {
                files = await this.panel.gitService.getMultiCommitFilesWithCompare(hashes, compareBranch);
            } else if (compareAgainst === 'working') {
                files = await this.panel.gitService.getMultiCommitFilesWithWorking(hashes);
            } else {
                // Default: compare against previous commit
                files = await this.panel.gitService.getMultiCommitFiles(hashes);
            }
            
            console.log('Backend: Sending multiCommitFiles with files:', files?.length || 0);
            this.panel.panel.webview.postMessage({
                command: 'multiCommitFiles',
                files: files || []
            });
        } catch (error) {
            console.error('Error getting multi-commit files:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to get multi-commit files'
            });
        }
    }

    async handleGetCommitsWithCompare(branch: string, compareBranch: string) {
        try {
            console.log('Getting commits with compare for branch:', branch, 'compareBranch:', compareBranch);
            const commits = await this.panel.gitService.getCommitsExcludingBranch(branch, compareBranch);
            
            console.log('Backend: Sending commitsWithCompare with commits:', commits?.length || 0);
            this.panel.panel.webview.postMessage({
                command: 'commitsWithCompare',
                commits: commits || [],
                branch: branch,
                compareBranch: compareBranch
            });
        } catch (error) {
            console.error('Error getting commits with compare:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to get commits with compare'
            });
        }
    }

    async handleCherryPickCommit(commitHash: string) {
        try {
            console.log('Cherry-picking commit:', commitHash);
            await this.panel.gitService.cherryPickCommit(commitHash);
            
            // Refresh the panel after cherry-picking
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Commit cherry-picked successfully'
            });
        } catch (error) {
            console.error('Error cherry-picking commit:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to cherry-pick commit'
            });
        }
    }

    async handleRevertCommit(commitHash: string) {
        try {
            console.log('Reverting commit:', commitHash);
            await this.panel.gitService.revertCommit(commitHash);
            
            // Refresh the panel after reverting
            await this.panel.refresh();
            
            this.panel.panel.webview.postMessage({
                command: 'success',
                message: 'Commit reverted successfully'
            });
        } catch (error) {
            console.error('Error reverting commit:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Failed to revert commit'
            });
        }
    }
}
