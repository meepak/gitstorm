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
            console.log('Getting branches...');
            const branches = await this.git.branch(['-a', '-v']);
            console.log('Branch data:', branches);
            const current = await this.git.revparse(['--abbrev-ref', 'HEAD']);
            console.log('Current branch:', current);
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
                } else if (branch.name.startsWith('remotes/')) {
                    // Parse remote branches
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
            console.log('Getting commits for branch:', branch, 'limit:', limit);
            
            // Use raw git command to get commits for specific branch
            let log;
            if (branch) {
                // Use raw git command for specific branch
                const result = await this.git.raw(['log', `--max-count=${limit}`, '--pretty=format:%H|%an|%ad|%s|%P', '--date=iso', branch]);
                log = this.parseRawGitLog(result);
            } else {
                // For current branch, use simple-git log
                log = await this.git.log({ maxCount: limit });
            }

            console.log('Commit log data:', log);
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

            console.log(`Loaded ${commits.length} commits for branch: ${branch || 'current'}`);
            return commits;
        } catch (error) {
            console.error('Error getting commits:', error);
            return [];
        }
    }

    private parseRawGitLog(rawOutput: string): any {
        const commits: any[] = [];
        const lines = rawOutput.trim().split('\n');
        
        for (const line of lines) {
            if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 4) {
                    commits.push({
                        hash: parts[0],
                        author_name: parts[1],
                        date: parts[2],
                        message: parts[3],
                        parent: parts[4] || '',
                        refs: ''
                    });
                }
            }
        }
        
        return { all: commits };
    }

    async getCurrentCommit(): Promise<Commit | null> {
        try {
            const log = await this.git.log({ maxCount: 1 });
            if (log.all && log.all.length > 0) {
                const commit = log.all[0];
                return {
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    author: commit.author_name,
                    date: new Date(commit.date),
                    message: commit.message,
                    parents: (commit as any).parent ? [(commit as any).parent] : [],
                    refs: this.parseRefs(commit.refs)
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting current commit:', error);
            return null;
        }
    }

    async getCommitDetails(hash: string): Promise<Commit | null> {
        try {
            console.log('getCommitDetails called with hash:', hash);
            
            // Get commit details and file changes
            const [log, showStat] = await Promise.all([
                this.git.log({ from: hash, maxCount: 1 }),
                this.git.show([hash, '--stat'])
            ]);
    
            console.log('Git log result:', log);
            const commitData = log.all[0];
            if (!commitData) {
                console.log('No commit data found for hash:', hash);
                return null;
            }
    
            console.log('Found commit data:', commitData);
    
            // Get parent hashes
            const parentsRaw = await this.git.raw(['show', '-s', '--pretty=%P', hash]);
            const parents = parentsRaw.trim() ? parentsRaw.trim().split(/\s+/) : [];
    
            const files = this.parseFileChanges(showStat);
            console.log('Parsed files:', files);
    
            return {
                hash: commitData.hash,
                shortHash: commitData.hash.substring(0, 7),
                message: commitData.message,
                author: commitData.author_name,
                date: new Date(commitData.date),
                parents,
                refs: this.parseRefs(commitData.refs || ''),
                files
            };
        } catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }
    

    async getFileDiff(hash: string, file?: string): Promise<string> {
        try {
            // Get diff between the commit and its parent
            const options = [`${hash}~1..${hash}`];
            if (file) {
                options.push('--', file);
            }
            return await this.git.diff(options);
        } catch (error) {
            console.error('Error getting file diff:', error);
            return '';
        }
    }

    async getFileDiffRange(range: string, file?: string): Promise<string> {
        try {
            // Get diff for a custom range (e.g., "branch1..branch2", "commit1..commit2")
            const options = [range];
            if (file) {
                options.push('--', file);
            }
            return await this.git.diff(options);
        } catch (error) {
            console.error('Error getting file diff range:', error);
            return '';
        }
    }

    async getFileContentAtCommit(hash: string, filePath: string): Promise<string> {
        try {
            // Get file content at specific commit
            const content = await this.git.show([`${hash}:${filePath}`]);
            return content;
        } catch (error) {
            console.error('Error getting file content at commit:', error);
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
            console.log('getMultiCommitFiles called with hashes:', commitHashes);
            const allFiles = new Map<string, FileChange>();
            
            for (const hash of commitHashes) {
                console.log('Processing hash in getMultiCommitFiles:', hash);
                const commit = await this.getCommitDetails(hash);
                console.log('Got commit for multi-commit files:', commit);
                if (commit && commit.files) {
                    console.log('Files for hash', hash, ':', commit.files.length);
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
            
            const result = Array.from(allFiles.values());
            console.log('getMultiCommitFiles returning:', result.length, 'files');
            return result;
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
        const lines = showOutput.split(/\r?\n/);
    
        for (const raw of lines) {
            const line = raw.trimEnd();
    
            // Stop at the summary line like: "3 files changed, 12 insertions(+), 2 deletions(-)"
            if (/^\s*\d+\s+files?\s+changed\b/i.test(line)) break;
    
            // Per-file stat lines contain a pipe and aren't blank
            if (!line || line.indexOf('|') === -1) continue;
    
            const [filePartRaw, statsRaw] = line.split('|');
            if (!statsRaw) continue;
    
            // Clean file segment:
            // - drop trailing "(xx%)"
            // - trim
            const filePart = filePartRaw.replace(/\s+\([^)]+\)\s*$/, '').trim();
            const file = filePart; // keep rename text literal; or post-process if you prefer only the final path
    
            const statsPart = statsRaw.trim();
    
            let additions = 0;
            let deletions = 0;
            let changes = 0;
    
            // Binary changes: "Bin 0 -> 123 bytes"
            if (/^Bin\b/i.test(statsPart)) {
                // keep additions/deletions at 0; mark as modified via status
                changes = 0;
            } else {
                // First integer is the total changed lines for this file
                const totalMatch = statsPart.match(/^(\d+)/);
                if (totalMatch) {
                    changes = parseInt(totalMatch[1], 10) || 0;
                }
    
                // Bar has + and - characters; git scales them, so use proportional split
                const plusChars  = (statsPart.match(/\+/g) || []).length;
                const minusChars = (statsPart.match(/-/g) || []).length;
    
                if (plusChars + minusChars > 0 && changes > 0) {
                    const totalChars = plusChars + minusChars;
                    additions = Math.round((plusChars / totalChars) * changes);
                    deletions = changes - additions;
                } else if (/\b\+\b/.test(statsPart) && changes > 0 && minusChars === 0) {
                    // Some themes show just a trailing '+' with the number
                    additions = changes;
                    deletions = 0;
                } else if (/\b-\b/.test(statsPart) && changes > 0 && plusChars === 0) {
                    additions = 0;
                    deletions = changes;
                } else if (changes > 0) {
                    // Fallback when bar is absent — assume additions
                    additions = changes;
                    deletions = 0;
                }
            }
    
            files.push({
                file,
                additions,
                deletions,
                changes,
                status: this.getFileStatus(filePartRaw) // keep your existing status resolver
            });
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
