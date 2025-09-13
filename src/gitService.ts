import * as vscode from 'vscode';
import { simpleGit, SimpleGit, LogResult } from 'simple-git';
import * as path from 'path';

export interface Branch {
    name: string;
    isLocal: boolean;
    isRemote: boolean;
    isCurrent: boolean;
    commit?: string;
    ahead?: number;
    behind?: number;
}

export interface Commit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: Date;
    parents: string[];
    refs: string[];
    files?: FileChange[];
}

export interface FileChange {
    file: string;
    additions: number;
    deletions: number;
    changes: number;
    status: 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?';
}

export class GitService {
    private git: SimpleGit;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            this.git = simpleGit(workspaceRoot);
        } else {
            // Initialize with current directory as fallback
            this.git = simpleGit();
        }
    }

    async isGitRepository(): Promise<boolean> {
        try {
            const result = await this.git.checkIsRepo();
            console.log('Git repository check result:', result);
            return result;
        } catch (error) {
            console.log('Git repository check failed:', error);
            return false;
        }
    }

    async getBranches(): Promise<Branch[]> {
        try {
            const branches = await this.git.branch(['-a', '-v']);
            const current = await this.git.revparse(['--abbrev-ref', 'HEAD']);
            const branchesList: Branch[] = [];

            // Parse local branches
            for (const [name, branch] of Object.entries(branches.branches)) {
                if (!branch.name.includes('/')) {
                    branchesList.push({
                        name: branch.name,
                        isLocal: true,
                        isRemote: false,
                        isCurrent: branch.name === current,
                        commit: branch.commit
                    });
                }
            }

            // Parse remote branches
            for (const [name, branch] of Object.entries(branches.branches)) {
                if (branch.name.includes('/') && !branch.name.startsWith('remotes/')) {
                    const remoteName = branch.name.replace(/^remotes\//, '');
                    branchesList.push({
                        name: remoteName,
                        isLocal: false,
                        isRemote: true,
                        isCurrent: false,
                        commit: branch.commit
                    });
                }
            }

            // Get ahead/behind info for current branch
            if (branchesList.length > 0) {
                const currentBranch = branchesList.find(b => b.isCurrent);
                if (currentBranch) {
                    try {
                        const status = await this.git.status();
                        currentBranch.ahead = status.ahead;
                        currentBranch.behind = status.behind;
                    } catch (error) {
                        console.warn('Could not get branch status:', error);
                    }
                }
            }

            return branchesList;
        } catch (error) {
            console.error('Error getting branches:', error);
            return [];
        }
    }

    async getCommits(branch?: string, limit: number = 100): Promise<Commit[]> {
        try {
            const options: any = ['--oneline', '--graph', '--decorate', `-n${limit}`];
            if (branch) {
                options.push(branch);
            }

            const log = await this.git.log(options);
            const commits: Commit[] = [];

            for (const commit of log.all) {
                commits.push({
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    message: commit.message,
                    author: commit.author_name,
                    date: new Date(commit.date),
                    parents: (commit as any).parent ? [(commit as any).parent] : [],
                    refs: this.parseRefs(commit.refs)
                });
            }

            return commits;
        } catch (error) {
            console.error('Error getting commits:', error);
            return [];
        }
    }

    async getCommitDetails(hash: string): Promise<Commit | null> {
        try {
            const show = await this.git.show([hash, '--stat']);
            const commit = await this.git.log({ from: hash, to: hash, maxCount: 1 });
            
            if (commit.all.length === 0) {
                return null;
            }

            const commitData = commit.all[0];
            const files = this.parseFileChanges(show);

            return {
                hash: commitData.hash,
                shortHash: commitData.hash.substring(0, 7),
                message: commitData.message,
                author: commitData.author_name,
                date: new Date(commitData.date),
                parents: (commitData as any).parent ? [(commitData as any).parent] : [],
                refs: this.parseRefs(commitData.refs),
                files
            };
        } catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }

    async getFileDiff(hash: string, file?: string): Promise<string> {
        try {
            const options = [hash];
            if (file) {
                options.push('--', file);
            }
            return await this.git.show(options);
        } catch (error) {
            console.error('Error getting file diff:', error);
            return '';
        }
    }

    async checkoutBranch(branchName: string): Promise<boolean> {
        try {
            await this.git.checkout(branchName);
            return true;
        } catch (error) {
            console.error('Error checking out branch:', error);
            return false;
        }
    }

    async createBranch(branchName: string, fromBranch?: string): Promise<boolean> {
        try {
            if (fromBranch) {
                // Create branch from specific commit/branch
                await this.git.checkout([fromBranch]);
                await this.git.checkoutLocalBranch(branchName);
            } else {
                // Create branch from current HEAD
                await this.git.checkoutLocalBranch(branchName);
            }
            return true;
        } catch (error) {
            console.error('Error creating branch:', error);
            return false;
        }
    }

    async deleteBranch(branchName: string, force: boolean = false): Promise<boolean> {
        try {
            await this.git.deleteLocalBranch(branchName, force);
            return true;
        } catch (error) {
            console.error('Error deleting branch:', error);
            return false;
        }
    }

    async mergeBranch(branchName: string): Promise<boolean> {
        try {
            await this.git.merge([branchName]);
            return true;
        } catch (error) {
            console.error('Error merging branch:', error);
            return false;
        }
    }

    async rebaseBranch(branchName: string): Promise<boolean> {
        try {
            await this.git.rebase([branchName]);
            return true;
        } catch (error) {
            console.error('Error rebasing branch:', error);
            return false;
        }
    }

    async cherryPickCommit(hash: string): Promise<boolean> {
        try {
            await (this.git as any).cherryPick(hash);
            return true;
        } catch (error) {
            console.error('Error cherry-picking commit:', error);
            return false;
        }
    }

    async revertCommit(hash: string): Promise<boolean> {
        try {
            await this.git.revert(hash);
            return true;
        } catch (error) {
            console.error('Error reverting commit:', error);
            return false;
        }
    }

    async getStatus(): Promise<any> {
        try {
            return await this.git.status();
        } catch (error) {
            console.error('Error getting status:', error);
            return null;
        }
    }

    async squashCommits(commitHashes: string[], newMessage: string): Promise<boolean> {
        try {
            if (commitHashes.length < 2) {
                return false;
            }

            // Get the first commit hash (oldest)
            const firstCommit = commitHashes[commitHashes.length - 1];
            const lastCommit = commitHashes[0];

            // Create a backup branch first
            const backupBranch = `backup-${Date.now()}`;
            await this.git.checkoutLocalBranch(backupBranch);

            // Go back to original branch
            const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
            await this.git.checkout(currentBranch);

            // Perform interactive rebase to squash commits
            // This is a simplified version - in a real implementation, you'd need to handle the interactive rebase properly
            await this.git.reset(['--soft', `${firstCommit}^`]);
            
            // Create a new commit with the combined message
            await this.git.commit([newMessage]);

            return true;
        } catch (error) {
            console.error('Error squashing commits:', error);
            return false;
        }
    }

    async getMultiCommitFiles(commitHashes: string[]): Promise<FileChange[]> {
        try {
            const allFiles = new Map<string, FileChange>();
            
            for (const hash of commitHashes) {
                const commit = await this.getCommitDetails(hash);
                if (commit && commit.files) {
                    for (const file of commit.files) {
                        if (allFiles.has(file.file)) {
                            const existing = allFiles.get(file.file)!;
                            existing.additions += file.additions;
                            existing.deletions += file.deletions;
                            existing.changes += file.changes;
                        } else {
                            allFiles.set(file.file, { ...file });
                        }
                    }
                }
            }
            
            return Array.from(allFiles.values());
        } catch (error) {
            console.error('Error getting multi-commit files:', error);
            return [];
        }
    }

    async getMultiCommitDiff(commitHashes: string[]): Promise<string> {
        try {
            if (commitHashes.length === 0) {
                return '';
            }

            const firstCommit = commitHashes[commitHashes.length - 1];
            const lastCommit = commitHashes[0];
            
            return await this.git.diff([`${firstCommit}^`, lastCommit]);
        } catch (error) {
            console.error('Error getting multi-commit diff:', error);
            return '';
        }
    }

    private parseRefs(refs: string): string[] {
        if (!refs) return [];
        return refs.split(', ').filter(ref => ref.trim() !== '');
    }

    private parseFileChanges(showOutput: string): FileChange[] {
        const files: FileChange[] = [];
        const lines = showOutput.split('\n');
        
        // Find the stats section
        let inStats = false;
        for (const line of lines) {
            if (line.includes(' files changed')) {
                inStats = true;
                continue;
            }
            
            if (inStats && line.trim() === '') {
                break;
            }
            
            if (inStats && line.includes('|')) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    const filePart = parts[0].trim();
                    const statsPart = parts[1].trim();
                    
                    // Extract file name and status
                    const fileMatch = filePart.match(/^(.+?)(\s+\([^)]+\))?$/);
                    const file = fileMatch ? fileMatch[1] : filePart;
                    
                    // Extract additions/deletions
                    const statsMatch = statsPart.match(/(\d+)\s+([+-])/g);
                    let additions = 0;
                    let deletions = 0;
                    
                    if (statsMatch) {
                        for (const stat of statsMatch) {
                            const match = stat.match(/(\d+)\s+([+-])/);
                            if (match) {
                                const count = parseInt(match[1]);
                                if (match[2] === '+') {
                                    additions = count;
                                } else {
                                    deletions = count;
                                }
                            }
                        }
                    }
                    
                    files.push({
                        file,
                        additions,
                        deletions,
                        changes: additions + deletions,
                        status: this.getFileStatus(filePart)
                    });
                }
            }
        }
        
        return files;
    }

    private getFileStatus(filePart: string): FileChange['status'] {
        if (filePart.includes('new file')) return 'A';
        if (filePart.includes('deleted')) return 'D';
        if (filePart.includes('renamed')) return 'R';
        return 'M';
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
