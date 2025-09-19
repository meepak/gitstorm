import { SimpleGit } from 'simple-git';
import { FileChange } from '../gitInterfaces';
import { GitParsers } from '../gitParsers';

export class FileOperations {
    constructor(private git: SimpleGit) {}

    async getFileDiff(hash: string, file?: string): Promise<string> {
        try {
            if (file) {
                // Show diff between commit and its parent for specific file
                return await this.git.diff([`${hash}~1..${hash}`, '--', file]);
            } else {
                // Show diff for the entire commit
                return await this.git.diff([`${hash}~1..${hash}`]);
            }
        } catch (error) {
            console.error('Error getting file diff:', error);
            return '';
        }
    }

    async getFileDiffRange(range: string, file?: string): Promise<string> {
        try {
            const args = [range];
            if (file) {
                args.push('--', file);
            }
            return await this.git.diff(args);
        } catch (error) {
            console.error('Error getting file diff range:', error);
            return '';
        }
    }

    async getFileContentAtCommit(hash: string, filePath: string): Promise<string> {
        try {
            return await this.git.show([`${hash}:${filePath}`]);
        } catch (error) {
            console.error(`Error getting file content at commit ${hash} for ${filePath}:`, error);
            return '';
        }
    }

    async getMultiCommitFiles(commitHashes: string[]): Promise<FileChange[]> {
        try {
            if (!commitHashes || !Array.isArray(commitHashes) || commitHashes.length === 0) {
                console.warn('getMultiCommitFiles: Invalid or empty commitHashes array:', commitHashes);
                return [];
            }
            if (commitHashes.length === 1) {
                // Use the commit details method to get files for single commit
                const log = await this.git.log({
                    from: commitHashes[0],
                    maxCount: 1
                });
                
                if (log.all && log.all.length > 0) {
                    const showOutput = await this.git.show([commitHashes[0], '--numstat']);
                    return GitParsers.parseFileChanges(showOutput);
                }
                return [];
            }

            const firstCommit = commitHashes[0];
            const lastCommit = commitHashes[commitHashes.length - 1];

            // Get diff between the parent of the first commit and the last commit
            const diffOutput = await this.git.diff(['--numstat', `${firstCommit}~1..${lastCommit}`]);
            return GitParsers.parseFileChanges(diffOutput);
        } catch (error) {
            console.error('Error getting multi-commit files:', error);
            return [];
        }
    }

    async getMultiCommitDiff(commitHashes: string[]): Promise<string> {
        try {
            if (commitHashes.length === 0) return '';
            if (commitHashes.length === 1) {
                return await this.getFileDiff(commitHashes[0]);
            }

            const firstCommit = commitHashes[0];
            const lastCommit = commitHashes[commitHashes.length - 1];

            return await this.git.diff([`${firstCommit}~1..${lastCommit}`]);
        } catch (error) {
            console.error('Error getting multi-commit diff:', error);
            return '';
        }
    }

    async getCommitDetailsWithCompare(hash: string, compareBranch: string): Promise<{ commit: any; files: FileChange[] } | null> {
        try {
            const [commit, files] = await Promise.all([
                this.getCommitDetails(hash),
                this.getFileChangesWithCompare(hash, compareBranch)
            ]);
            
            return { commit, files };
        } catch (error) {
            console.error('Error getting commit details with compare:', error);
            return null;
        }
    }

    async getCommitDetailsWithWorking(hash: string): Promise<{ commit: any; files: FileChange[] } | null> {
        try {
            const [commit, files] = await Promise.all([
                this.getCommitDetails(hash),
                this.getFileChangesWithWorking(hash)
            ]);
            
            return { commit, files };
        } catch (error) {
            console.error('Error getting commit details with working:', error);
            return null;
        }
    }

    async getMultiCommitFilesWithCompare(hashes: string[], compareBranch: string): Promise<FileChange[]> {
        try {
            if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
                console.warn('getMultiCommitFilesWithCompare: Invalid or empty hashes array:', hashes);
                return [];
            }
            
            if (hashes.length === 1) {
                // For single commit, use the existing method
                return await this.getFileChangesWithCompare(hashes[0], compareBranch);
            }

            // For multiple commits, create a range from parent of first commit to last commit
            const firstCommit = hashes[0];
            const lastCommit = hashes[hashes.length - 1];
            const diff = await this.git.diff([`${compareBranch}..${lastCommit}`, '--numstat']);
            return GitParsers.parseFileChanges(diff);
        } catch (error) {
            console.error('Error getting multi-commit files with compare:', error);
            return [];
        }
    }

    async getMultiCommitFilesWithWorking(hashes: string[]): Promise<FileChange[]> {
        try {
            if (!hashes || !Array.isArray(hashes) || hashes.length === 0) {
                console.warn('getMultiCommitFilesWithWorking: Invalid or empty hashes array:', hashes);
                return [];
            }
            
            if (hashes.length === 1) {
                // For single commit, use the existing method
                return await this.getFileChangesWithWorking(hashes[0]);
            }

            // For multiple commits, create a range from parent of first commit to HEAD
            const firstCommit = hashes[0];
            const diff = await this.git.diff([`${firstCommit}~1..HEAD`, '--numstat']);
            return GitParsers.parseFileChanges(diff);
        } catch (error) {
            console.error('Error getting multi-commit files with working:', error);
            return [];
        }
    }

    async getFileChangesWithCompare(hash: string, compareBranch: string): Promise<FileChange[]> {
        try {
            // Get file changes by comparing hash against compareBranch
            const diff = await this.git.diff([`${compareBranch}..${hash}`, '--numstat']);
            return GitParsers.parseFileChanges(diff);
        } catch (error) {
            console.error('Error getting file changes with compare:', error);
            return [];
        }
    }

    async getFileChangesWithWorking(hash: string): Promise<FileChange[]> {
        try {
            // Get file changes by comparing hash against working directory
            const diff = await this.git.diff([`${hash}..HEAD`, '--numstat']);
            return GitParsers.parseFileChanges(diff);
        } catch (error) {
            console.error('Error getting file changes with working:', error);
            return [];
        }
    }

    // Helper method for getCommitDetails (used by other methods)
    private async getCommitDetails(hash: string): Promise<any> {
        try {
            const log = await this.git.log({
                from: hash,
                maxCount: 1,
                format: {
                    hash: '%H',
                    author_name: '%an',
                    date: '%ci',
                    message: '%s',
                    parent: '%P',
                    refs: '%D'
                }
            });

            if (log.all && log.all.length > 0) {
                const commit = log.all[0];
                return {
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    message: commit.message,
                    author: commit.author_name,
                    date: new Date(commit.date),
                    parents: (commit as any).parent ? (commit as any).parent.split(' ').filter((p: string) => p.trim()) : [],
                    refs: GitParsers.parseRefs(commit.refs || '')
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }
}
