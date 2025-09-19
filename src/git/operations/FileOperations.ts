import { SimpleGit } from 'simple-git';
import { FileChange } from '../gitInterfaces';
import { GitParsers } from '../gitParsers';

export class FileOperations {
    constructor(private git: SimpleGit) {}

    async getFileDiff(hash: string, file?: string): Promise<string> {
        try {
            if (file) {
                // Show diff between commit and its parent for specific file
                console.log('🚀🚀🚀 UPDATED FileOperations.getFileDiff called for file:', file, 'hash:', hash);
                
                // First try the standard approach
                let diff = await this.git.diff([`${hash}~1..${hash}`, '--', file]);
                console.log('FileOperations: Standard diff result length:', diff ? diff.length : 'null/undefined');
                
                // If diff is empty, try alternative approaches for merge commits
                if (!diff || diff.trim() === '') {
                    console.log('FileOperations: Standard diff empty, trying merge commit approaches');
                    
                    // Try comparing with the merge base
                    try {
                        const mergeBase = await this.git.raw(['merge-base', `${hash}~1`, `${hash}~2`]);
                        if (mergeBase && mergeBase.trim()) {
                            diff = await this.git.diff([`${mergeBase.trim()}..${hash}`, '--', file]);
                            console.log('FileOperations: Merge base diff result length:', diff ? diff.length : 'null/undefined');
                        }
                    } catch (mergeBaseError) {
                        console.log('FileOperations: Merge base approach failed:', mergeBaseError);
                    }
                    
                    // If still empty, try comparing with the first parent
                    if (!diff || diff.trim() === '') {
                        try {
                            diff = await this.git.diff([`${hash}~1`, `${hash}`, '--', file]);
                            console.log('FileOperations: First parent diff result length:', diff ? diff.length : 'null/undefined');
                        } catch (parentError) {
                            console.log('FileOperations: First parent approach failed:', parentError);
                        }
                    }
                }
                
                return diff;
            } else {
                // Show diff for the entire commit
                console.log('FileOperations: Getting diff for entire commit:', hash);
                const diff = await this.git.diff([`${hash}~1..${hash}`]);
                console.log('FileOperations: Full diff result length:', diff ? diff.length : 'null/undefined');
                return diff;
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

    async fileExistsAtCommit(hash: string, filePath: string): Promise<boolean> {
        try {
            console.log('🚀🚀🚀 FileOperations.fileExistsAtCommit checking:', hash, filePath);
            // Use git cat-file to check if the file exists at the commit
            await this.git.raw(['cat-file', '-e', `${hash}:${filePath}`]);
            console.log('🚀🚀🚀 FileOperations.fileExistsAtCommit: File exists at commit:', filePath);
            return true;
        } catch (error) {
            console.log('🚀🚀🚀 FileOperations.fileExistsAtCommit: File does not exist at commit:', filePath, 'error:', error);
            // If git cat-file fails, the file doesn't exist
            return false;
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
            console.log('🚀🚀🚀 FileOperations.getCommitDetailsWithCompare called with hash:', hash, 'compareBranch:', compareBranch);
            
            const [commit, files] = await Promise.all([
                this.getCommitDetails(hash),
                this.getFileChangesWithCompare(hash, compareBranch)
            ]);
            
            console.log('🚀🚀🚀 FileOperations: Retrieved commit with hash:', commit?.hash, 'files count:', files?.length);
            
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
            const log = await this.git.raw(['log', '--max-count=1', '--format=%H|%an|%ci|%s|%P|%D', hash]);
            
            if (!log || log.trim() === '') {
                console.log('🚀🚀🚀 FileOperations: No commit found for hash:', hash);
                return null;
            }
            
            const lines = log.trim().split('\n');
            const commitLine = lines[0];
            const parts = commitLine.split('|');
            
            const commit = {
                hash: parts[0],
                author_name: parts[1],
                date: parts[2],
                message: parts[3],
                parent: parts[4],
                refs: parts[5] || ''
            };
            
            // Validate that the returned commit matches the requested hash
            if (commit.hash !== hash) {
                console.error('🚀🚀🚀 FileOperations: Hash mismatch! Requested:', hash, 'but got:', commit.hash);
                console.error('🚀🚀🚀 This usually means the requested commit does not exist in the repository');
                return null;
            }
            
            return {
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 7),
                message: commit.message,
                author: commit.author_name,
                date: new Date(commit.date),
                parents: commit.parent ? commit.parent.split(' ').filter((p: string) => p.trim()) : [],
                refs: GitParsers.parseRefs(commit.refs || '')
            };
        } catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }
}
