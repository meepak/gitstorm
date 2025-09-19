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
            return status.files.map(file => ({
                file: file.path,
                status: GitParsers.parseFileStatus(file.index || file.working_dir || 'M'),
                additions: 0,
                deletions: 0,
                changes: 0
            }));
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
}
