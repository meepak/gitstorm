import * as vscode from 'vscode';
import { simpleGit, SimpleGit } from 'simple-git';
import { Branch, Commit, FileChange } from './gitInterfaces';
import { GitOperations } from './gitOperations';

export class GitService {
    private git: SimpleGit;
    private operations: GitOperations;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            this.git = simpleGit(workspaceRoot);
        } else {
            // Initialize with current directory as fallback
            this.git = simpleGit();
        }
        
        this.operations = new GitOperations(this.git);
    }

    async isGitRepository(): Promise<boolean> {
        return await this.operations.isGitRepository();
    }

    async getBranches(): Promise<Branch[]> {
        return await this.operations.getBranches();
    }

    async getCommits(branch?: string, limit: number = 100): Promise<Commit[]> {
        return await this.operations.getCommits(branch, limit);
    }

    async getCommitsExcludingBranch(branch: string, excludeBranch: string, limit: number = 100): Promise<Commit[]> {
        return await this.operations.getCommitsExcludingBranch(branch, excludeBranch, limit);
    }

    async getCurrentCommit(): Promise<Commit | null> {
        return await this.operations.getCurrentCommit();
    }

    async getCommitDetails(hash: string): Promise<Commit | null> {
        return await this.operations.getCommitDetails(hash);
    }

    async getFileDiff(hash: string, file?: string): Promise<string> {
        return await this.operations.getFileDiff(hash, file);
    }

    async getFileDiffRange(range: string, file?: string): Promise<string> {
        return await this.operations.getFileDiffRange(range, file);
    }

    async getFileContentAtCommit(hash: string, filePath: string): Promise<string> {
        return await this.operations.getFileContentAtCommit(hash, filePath);
    }

    async checkoutBranch(branchName: string): Promise<boolean> {
        return await this.operations.checkoutBranch(branchName);
    }

    async createBranch(branchName: string, fromBranch?: string): Promise<boolean> {
        return await this.operations.createBranch(branchName, fromBranch);
    }

    async deleteBranch(branchName: string, force: boolean = false): Promise<boolean> {
        return await this.operations.deleteBranch(branchName, force);
    }

    async mergeBranch(branchName: string): Promise<boolean> {
        return await this.operations.mergeBranch(branchName);
    }

    async rebaseBranch(branchName: string): Promise<boolean> {
        return await this.operations.rebaseBranch(branchName);
    }

    async cherryPickCommit(hash: string): Promise<boolean> {
        return await this.operations.cherryPickCommit(hash);
    }

    async revertCommit(hash: string): Promise<boolean> {
        return await this.operations.revertCommit(hash);
    }

    async getStatus(): Promise<any> {
        return await this.operations.getStatus();
    }

    async squashCommits(commitHashes: string[], newMessage: string): Promise<boolean> {
        return await this.operations.squashCommits(commitHashes, newMessage);
    }

    async getMultiCommitFiles(commitHashes: string[]): Promise<FileChange[]> {
        return await this.operations.getMultiCommitFiles(commitHashes);
    }

    async getMultiCommitDiff(commitHashes: string[]): Promise<string> {
        return await this.operations.getMultiCommitDiff(commitHashes);
    }

    async getCurrentBranch(): Promise<string> {
        return await this.operations.getCurrentBranch();
    }

    async hasUncommittedChanges(): Promise<boolean> {
        return await this.operations.hasUncommittedChanges();
    }

    async getUncommittedChanges(): Promise<FileChange[]> {
        return await this.operations.getUncommittedChanges();
    }

    async commitChanges(message: string): Promise<boolean> {
        return await this.operations.commitChanges(message);
    }

    async getCommitDetailsWithCompare(hash: string, compareBranch: string): Promise<Commit | null> {
        return await this.operations.getCommitDetailsWithCompare(hash, compareBranch);
    }

    async getCommitDetailsWithWorking(hash: string): Promise<Commit | null> {
        return await this.operations.getCommitDetailsWithWorking(hash);
    }

    async getMultiCommitFilesWithCompare(hashes: string[], compareBranch: string): Promise<FileChange[]> {
        return await this.operations.getMultiCommitFilesWithCompare(hashes, compareBranch);
    }

    async getMultiCommitFilesWithWorking(hashes: string[]): Promise<FileChange[]> {
        return await this.operations.getMultiCommitFilesWithWorking(hashes);
    }

    async getFileChangesWithCompare(hash: string, compareBranch: string): Promise<FileChange[]> {
        return await this.operations.getFileChangesWithCompare(hash, compareBranch);
    }

    async getFileChangesWithWorking(hash: string): Promise<FileChange[]> {
        return await this.operations.getFileChangesWithWorking(hash);
    }

    getRepoRoot(): string {
        return this.operations.getRepoRoot();
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}

// Re-export interfaces for convenience
export { Branch, Commit, FileChange } from './gitInterfaces';
