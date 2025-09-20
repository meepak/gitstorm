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
            const status = await this.git.status();
            // Filter out staged files - only show files that are not staged
            const unstagedFiles = status.files.filter(file => !file.index || file.index === ' ');
            const files = unstagedFiles.map(file => ({
                file: file.path,
                status: GitParsers.parseFileStatus(file.working_dir || 'M'),
                additions: 0,
                deletions: 0,
                changes: 0
            }));

            // Get detailed diff stats for each file
            for (const file of files) {
                try {
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
                } catch (diffError) {
                    console.log('Could not get diff stats for file:', file.file, diffError);
                    // Keep default values (0, 0, 0)
                }
            }

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
        return (this.git as any).getWorkingDirectory();
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
            const status = await this.git.status();
            // Get files that are staged (have index changes)
            const stagedFiles = status.files.filter(file => file.index && file.index !== ' ');
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
            await this.git.reset();
            return true;
        } catch (error) {
            console.error('Error unstaging all changes:', error);
            return false;
        }
    }

    async unstageFile(filePath: string): Promise<boolean> {
        try {
            await this.git.reset(['--', filePath]);
            return true;
        } catch (error) {
            console.error('Error unstaging file:', error);
            return false;
        }
    }

    async revertFile(filePath: string): Promise<boolean> {
        try {
            await this.git.checkout(['--', filePath]);
            return true;
        } catch (error) {
            console.error('Error reverting file:', error);
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
}
