import { SimpleGit } from 'simple-git';
import { FileChange } from '../gitInterfaces';
import { GitParsers } from '../gitParsers';

export class WorkingDirectoryOperations {
    constructor(private git: SimpleGit) {}

    async getStatus(): Promise<any> {
        try {
            return await this.git.status();
        } catch (error) {
            console.error('Error getting status:', error);
            return null;
        }
    }

    async hasUncommittedChanges(): Promise<boolean> {
        try {
            const status = await this.git.status();
            return status.files.length > 0;
        } catch (error) {
            console.error('Error checking uncommitted changes:', error);
            return false;
        }
    }

    async getUncommittedChanges(): Promise<FileChange[]> {
        try {
            // Use git diff --cached --name-only to get staged files directly
            const stagedFilesOutput = await this.git.raw(['diff', '--cached', '--name-only']);
            const stagedFilePaths = stagedFilesOutput.trim().split('\n').filter(path => path.trim() !== '');
            
            console.log('=== UNCOMMITTED CHANGES DEBUG ===');
            console.log('Staged files from git diff --cached:', stagedFilePaths);
            
            const status = await this.git.status();
            console.log('Git status object:', JSON.stringify(status, null, 2));
            console.log('status.staged array:', status.staged);
            console.log('All files in status:', status.files.map(f => ({
                path: f.path,
                index: f.index,
                working_dir: f.working_dir
            })));

            // Get all files that are not staged (including untracked files)
            // This includes: modified files, untracked files, deleted files, etc.
            const unstagedFiles = status.files.filter(file => {
                // Include files that have working directory changes (not staged)
                // or are untracked (no index status)
                // BUT exclude files that are staged (using direct git diff --cached output)
                const hasWorkingDirChanges = file.working_dir !== undefined;
                const isUntracked = !file.index || file.index === ' ';
                const isStaged = stagedFilePaths.includes(file.path);

                const shouldInclude = (hasWorkingDirChanges || isUntracked) && !isStaged;
                console.log(`File ${file.path}: hasWorkingDirChanges=${hasWorkingDirChanges}, isUntracked=${isUntracked}, isStaged=${isStaged}, shouldInclude=${shouldInclude}`);

                return shouldInclude;
            });
            
            console.log('Filtered unstaged files:', unstagedFiles.map(f => f.path));
            console.log('=== END UNCOMMITTED CHANGES DEBUG ===');
            
            const files = unstagedFiles.map(file => {
                // Determine the status based on working directory changes
                let fileStatus: 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?' = 'M'; // Default to modified
                if (file.working_dir === 'D') {
                    fileStatus = 'D'; // Deleted
                } else if (file.working_dir === 'A') {
                    fileStatus = 'A'; // Added
                } else if (file.working_dir === 'M') {
                    fileStatus = 'M'; // Modified
                } else if (file.working_dir === 'R') {
                    fileStatus = 'R'; // Renamed
                } else if (!file.index || file.index === ' ') {
                    // This is likely an untracked file
                    fileStatus = 'U'; // Untracked
                }
                
                return {
                    file: file.path,
                    status: fileStatus,
                    additions: 0,
                    deletions: 0,
                    changes: 0
                };
            });

            // Get detailed diff stats for each file
            for (const file of files) {
                try {
                    if (file.status === 'U') {
                        // For untracked files, we can't get diff stats from HEAD
                        // Just set some default values
                        file.additions = 1; // Assume it's a new file
                        file.deletions = 0;
                        file.changes = 1;
                    } else {
                        // Get diff stats using git diff --numstat
                        const diffOutput = await this.git.raw(['diff', '--numstat', 'HEAD', '--', file.file]);
                        if (diffOutput && diffOutput.trim()) {
                            const lines = diffOutput.trim().split('\n');
                            for (const line of lines) {
                                const parts = line.split('\t');
                                if (parts.length >= 3) {
                                    const additions = parseInt(parts[0]) || 0;
                                    const deletions = parseInt(parts[1]) || 0;
                                    file.additions = additions;
                                    file.deletions = deletions;
                                    file.changes = additions + deletions;
                                    break;
                                }
                            }
                        }
                    }
                } catch (diffError) {
                    console.log('Could not get diff stats for file:', file.file, diffError);
                    // Keep default values (0, 0, 0)
                }
            }

            console.log('Processed uncommitted files:', files);
            return files;
        } catch (error) {
            console.error('Error getting uncommitted changes:', error);
            return [];
        }
    }

    async commitChanges(message: string): Promise<boolean> {
        try {
            await this.git.add('.');
            await this.git.commit(message);
            return true;
        } catch (error) {
            console.error('Error committing changes:', error);
            return false;
        }
    }

    async isGitRepository(): Promise<boolean> {
        try {
            const result = await this.git.checkIsRepo();
            return result;
        } catch (error) {
            console.error('Error checking if git repository:', error);
            return false;
        }
    }

    getRepoRoot(): string {
        // SimpleGit doesn't have getWorkingDirectory method
        // This method is deprecated and should not be used
        // Use GitService.getRepoRoot() instead
        throw new Error('getRepoRoot() is deprecated. Use GitService.getRepoRoot() instead.');
    }

    async hasStagedChanges(): Promise<boolean> {
        try {
            const status = await this.git.status();
            return status.staged.length > 0;
        } catch (error) {
            console.error('Error checking staged changes:', error);
            return false;
        }
    }

    async getStagedChanges(): Promise<FileChange[]> {
        try {
            // Use git diff --cached --name-only to get staged files directly
            const stagedFilesOutput = await this.git.raw(['diff', '--cached', '--name-only']);
            const stagedFilePaths = stagedFilesOutput.trim().split('\n').filter(path => path.trim() !== '');
            
            console.log('=== STAGED CHANGES DEBUG ===');
            console.log('Staged files from git diff --cached:', stagedFilePaths);
            
            const status = await this.git.status();
            console.log('Git status object:', JSON.stringify(status, null, 2));
            console.log('status.staged array:', status.staged);
            console.log('status.files array:', status.files.map(f => ({ 
                path: f.path, 
                index: f.index, 
                working_dir: f.working_dir 
            })));
            
            // Get files that are staged - use the direct git diff output
            const stagedFiles = status.files.filter(file => {
                const isStaged = stagedFilePaths.includes(file.path);
                console.log(`File ${file.path}: isStaged=${isStaged} (from git diff --cached)`);
                return isStaged;
            });
            
            console.log('Filtered staged files:', stagedFiles.map(f => f.path));
            console.log('=== END STAGED CHANGES DEBUG ===');
            const files = stagedFiles.map(file => ({
                file: file.path,
                status: GitParsers.parseFileStatus(file.index || 'M'),
                additions: 0,
                deletions: 0,
                changes: 0
            }));

            // Get detailed diff stats for each staged file
            for (const file of files) {
                try {
                    // Get diff stats using git diff --cached --numstat
                    const diffOutput = await this.git.raw(['diff', '--cached', '--numstat', '--', file.file]);
                    if (diffOutput && diffOutput.trim()) {
                        const lines = diffOutput.trim().split('\n');
                        for (const line of lines) {
                            const parts = line.split('\t');
                            if (parts.length >= 3) {
                                const additions = parseInt(parts[0]) || 0;
                                const deletions = parseInt(parts[1]) || 0;
                                file.additions = additions;
                                file.deletions = deletions;
                                file.changes = additions + deletions;
                                break;
                            }
                        }
                    }
                } catch (diffError) {
                    console.log('Could not get diff stats for staged file:', file.file, diffError);
                    // Keep default values (0, 0, 0)
                }
            }

            return files;
        } catch (error) {
            console.error('Error getting staged changes:', error);
            return [];
        }
    }

    async stageAllChanges(): Promise<boolean> {
        try {
            await this.git.add('.');
            return true;
        } catch (error) {
            console.error('Error staging all changes:', error);
            return false;
        }
    }

    async stageFile(filePath: string): Promise<boolean> {
        try {
            await this.git.add(filePath);
            return true;
        } catch (error) {
            console.error('Error staging file:', error);
            return false;
        }
    }

    async unstageAllChanges(): Promise<boolean> {
        try {
            console.log('Executing git reset HEAD to unstage all changes');
            await this.git.reset(['HEAD']);
            console.log('Successfully unstaged all changes');
            return true;
        } catch (error) {
            console.error('Error unstaging all changes:', error);
            return false;
        }
    }

    async unstageFile(filePath: string): Promise<boolean> {
        try {
            // For untracked files that are staged, we need to remove them from the index
            // For tracked files that are staged, we can use reset
            const status = await this.git.status();
            const file = status.files.find(f => f.path === filePath);
            
            if (file && (!file.index || file.index === ' ')) {
                // This is an untracked file that was staged, remove it from index
                await this.git.raw(['rm', '--cached', '--', filePath]);
            } else {
                // This is a tracked file, use reset to unstage
                await this.git.reset(['--', filePath]);
            }
            return true;
        } catch (error) {
            console.error('Error unstaging file:', error);
            return false;
        }
    }

    async revertFile(filePath: string): Promise<boolean> {
        try {
            console.log('=== REVERT FILE DEBUG ===');
            console.log('Reverting specific file:', filePath);
            console.log('File path type:', typeof filePath);
            console.log('File path length:', filePath?.length);
            console.log('Git command: git checkout --', filePath);
            
            // Check if file exists in git status first
            const status = await this.git.status();
            console.log('Current git status files:', status.files.map(f => f.path));
            console.log('Looking for file in status:', status.files.find(f => f.path === filePath));
            
            const isUntracked = status.not_added?.includes(filePath) === true;
            if (isUntracked) {
                // Remove untracked file/dir (path-limited, safe). -d handles directories too.
                await this.git.raw(['clean', '-fd', '--', filePath]);
                console.log('Successfully reverted untracked file:', filePath);
                console.log('=== END REVERT FILE DEBUG ===');
                return true;
            } 

            // Get repository root and check if file exists in working directory
            const fs = require('fs');
            const path = require('path');
            const repoRoot = await this.git.revparse(['--show-toplevel']);
            const fullPath = path.resolve(repoRoot, filePath);
            console.log('Repository root:', repoRoot);
            console.log('Checking if file exists at:', fullPath);
            console.log('File exists:', fs.existsSync(fullPath));

            
            // Try to find the exact file path from git status
            // const exactFile = status.files.find(f => f.path === filePath || f.path.endsWith(filePath));
            if (fullPath) {

                
                
                // console.log('Found exact file match:', exactFile.path);
                // await this.git.checkout(['--', exactFile.path]);
                // await this.git.checkout(['--', fullPath]);
                await this.git.raw(['restore', fullPath]);
            } 
            
            // else { // if above do not work, this will never work
            //     console.log('No exact match found, trying original path');
            //     // await this.git.checkout(['--', filePath]);
            //     await this.git.raw(['restore', filePath]);
            // }
            
            console.log('Successfully reverted file:', filePath);
            console.log('=== END REVERT FILE DEBUG ===');
            return true;
        } catch (error) {
            console.error('Error reverting file:', filePath, error);
            return false;
        }
    }

    async stashChanges(message?: string): Promise<boolean> {
        try {
            if (message) {
                await this.git.stash(['push', '-m', message]);
            } else {
                await this.git.stash();
            }
            return true;
        } catch (error) {
            console.error('Error stashing changes:', error);
            return false;
        }
    }

    async commitStagedChanges(message: string): Promise<boolean> {
        try {
            await this.git.commit(message);
            return true;
        } catch (error) {
            console.error('Error committing staged changes:', error);
            return false;
        }
    }

    async commitAndPushStagedChanges(message: string): Promise<boolean> {
        try {
            await this.git.commit(message);
            await this.git.push();
            return true;
        } catch (error) {
            console.error('Error committing and pushing staged changes:', error);
            return false;
        }
    }

    async pushCommit(commitHash: string): Promise<boolean> {
        try {
            await this.git.push('origin', commitHash);
            return true;
        } catch (error) {
            console.error('Error pushing commit:', error);
            return false;
        }
    }

    async discardAllChanges(): Promise<boolean> {
        try {
            // Reset all changes in working directory
            await this.git.reset(['--hard', 'HEAD']);
            // Clean untracked files
            await this.git.clean('f', ['-d']);
            return true;
        } catch (error) {
            console.error('Error discarding all changes:', error);
            return false;
        }
    }

    async getWorkingChanges(): Promise<{ uncommitted: FileChange[], staged: FileChange[] }> {
        try {
            // Get staged files using git diff --cached --name-only
            const stagedFilesOutput = await this.git.raw(['diff', '--cached', '--name-only']);
            const stagedFilePaths = stagedFilesOutput.trim().split('\n').filter(path => path.trim() !== '');
            
            // Get git status once
            const status = await this.git.status();
            
            console.log('=== WORKING CHANGES DEBUG ===');
            console.log('Raw git diff --cached output:', `"${stagedFilesOutput}"`);
            console.log('Staged files from git diff --cached:', stagedFilePaths);
            console.log('Git status files:', status.files.map(f => ({ 
                path: f.path, 
                index: f.index, 
                working_dir: f.working_dir 
            })));
            console.log('status.staged array:', status.staged);

            // Filter staged files
            const stagedFiles = status.files.filter(file => {
                const isInStagedPaths = stagedFilePaths.includes(file.path);
                const isInStagedArray = status.staged.includes(file.path);
                console.log(`File ${file.path}: isInStagedPaths=${isInStagedPaths}, isInStagedArray=${isInStagedArray}`);
                return isInStagedPaths || isInStagedArray;
            });
            
            // Filter uncommitted files (working directory changes + untracked, but not staged)
            const uncommittedFiles = status.files.filter(file => {
                const hasWorkingDirChanges = file.working_dir !== undefined;
                const isUntracked = !file.index || file.index === ' ';
                const isStaged = stagedFilePaths.includes(file.path) || status.staged.includes(file.path);
                const shouldInclude = (hasWorkingDirChanges || isUntracked) && !isStaged;
                console.log(`File ${file.path}: hasWorkingDirChanges=${hasWorkingDirChanges}, isUntracked=${isUntracked}, isStaged=${isStaged}, shouldInclude=${shouldInclude}`);
                return shouldInclude;
            });

            console.log('Filtered staged files:', stagedFiles.map(f => f.path));
            console.log('Filtered uncommitted files:', uncommittedFiles.map(f => f.path));
            console.log('=== END WORKING CHANGES DEBUG ===');

            // Process staged files
            const stagedChanges = stagedFiles.map(file => ({
                file: file.path,
                status: GitParsers.parseFileStatus(file.index || 'M'),
                additions: 0,
                deletions: 0,
                changes: 0
            }));

            // Process uncommitted files
            const uncommittedChanges = uncommittedFiles.map(file => {
                let fileStatus: 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?' = 'M';
                if (file.working_dir === 'D') {
                    fileStatus = 'D';
                } else if (file.working_dir === 'A') {
                    fileStatus = 'A';
                } else if (file.working_dir === 'M') {
                    fileStatus = 'M';
                } else if (file.working_dir === 'R') {
                    fileStatus = 'R';
                } else if (!file.index || file.index === ' ') {
                    fileStatus = 'U';
                }
                
                return {
                    file: file.path,
                    status: fileStatus,
                    additions: 0,
                    deletions: 0,
                    changes: 0
                };
            });

            // Get diff stats for staged files
            for (const file of stagedChanges) {
                try {
                    const diffOutput = await this.git.raw(['diff', '--cached', '--numstat', '--', file.file]);
                    if (diffOutput && diffOutput.trim()) {
                        const lines = diffOutput.trim().split('\n');
                        for (const line of lines) {
                            const parts = line.split('\t');
                            if (parts.length >= 3) {
                                const additions = parseInt(parts[0]) || 0;
                                const deletions = parseInt(parts[1]) || 0;
                                file.additions = additions;
                                file.deletions = deletions;
                                file.changes = additions + deletions;
                                break;
                            }
                        }
                    }
                } catch (diffError) {
                    console.log('Could not get diff stats for staged file:', file.file, diffError);
                }
            }

            // Get diff stats for uncommitted files
            for (const file of uncommittedChanges) {
                try {
                    if (file.status === 'U') {
                        file.additions = 1;
                        file.deletions = 0;
                        file.changes = 1;
                    } else {
                        const diffOutput = await this.git.raw(['diff', '--numstat', 'HEAD', '--', file.file]);
                        if (diffOutput && diffOutput.trim()) {
                            const lines = diffOutput.trim().split('\n');
                            for (const line of lines) {
                                const parts = line.split('\t');
                                if (parts.length >= 3) {
                                    const additions = parseInt(parts[0]) || 0;
                                    const deletions = parseInt(parts[1]) || 0;
                                    file.additions = additions;
                                    file.deletions = deletions;
                                    file.changes = additions + deletions;
                                    break;
                                }
                            }
                        }
                    }
                } catch (diffError) {
                    console.log('Could not get diff stats for uncommitted file:', file.file, diffError);
                }
            }

            return {
                uncommitted: uncommittedChanges,
                staged: stagedChanges
            };
        } catch (error) {
            console.error('Error getting working changes:', error);
            return { uncommitted: [], staged: [] };
        }
    }
}
