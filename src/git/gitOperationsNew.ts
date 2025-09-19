import { SimpleGit } from 'simple-git';
import { Branch, Commit, FileChange } from './gitInterfaces';
import { BranchOperations } from './operations/BranchOperations';
import { CommitOperations } from './operations/CommitOperations';
import { FileOperations } from './operations/FileOperations';
import { WorkingDirectoryOperations } from './operations/WorkingDirectoryOperations';

export class GitOperations {
    private branchOps: BranchOperations;
    private commitOps: CommitOperations;
    private fileOps: FileOperations;
    private workingDirOps: WorkingDirectoryOperations;

    constructor(private git: SimpleGit) {
        this.branchOps = new BranchOperations(git);
        this.commitOps = new CommitOperations(git);
        this.fileOps = new FileOperations(git);
        this.workingDirOps = new WorkingDirectoryOperations(git);
    }

    // Branch Operations
    async getBranches(): Promise<Branch[]> {
        return this.branchOps.getBranches();
    }

    async getCurrentBranch(): Promise<string> {
        return this.branchOps.getCurrentBranch();
    }

    async checkoutBranch(branchName: string): Promise<boolean> {
        return this.branchOps.checkoutBranch(branchName);
    }

    async createBranch(branchName: string, fromBranch?: string): Promise<boolean> {
        return this.branchOps.createBranch(branchName, fromBranch);
    }

    async deleteBranch(branchName: string, force: boolean = false): Promise<boolean> {
        return this.branchOps.deleteBranch(branchName, force);
    }

    async mergeBranch(branchName: string): Promise<boolean> {
        return this.branchOps.mergeBranch(branchName);
    }

    async rebaseBranch(branchName: string): Promise<boolean> {
        return this.branchOps.rebaseBranch(branchName);
    }

    // Commit Operations
    async getCommits(branch?: string, limit: number = 100): Promise<Commit[]> {
        return this.commitOps.getCommits(branch, limit);
    }

    async getCommitsExcludingBranch(branch: string, excludeBranch: string, limit: number = 100): Promise<Commit[]> {
        return this.commitOps.getCommitsExcludingBranch(branch, excludeBranch, limit);
    }

    async getCurrentCommit(): Promise<Commit | null> {
        return this.commitOps.getCurrentCommit();
    }

    async getCommitDetails(hash: string): Promise<Commit | null> {
        return this.commitOps.getCommitDetails(hash);
    }

    async cherryPickCommit(hash: string): Promise<boolean> {
        return this.commitOps.cherryPickCommit(hash);
    }

    async revertCommit(hash: string): Promise<boolean> {
        return this.commitOps.revertCommit(hash);
    }

    async squashCommits(commitHashes: string[], newMessage: string): Promise<boolean> {
        return this.commitOps.squashCommits(commitHashes, newMessage);
    }

    // File Operations
    async getFileDiff(hash: string, file?: string): Promise<string> {
        return this.fileOps.getFileDiff(hash, file);
    }

    async getFileDiffRange(range: string, file?: string): Promise<string> {
        return this.fileOps.getFileDiffRange(range, file);
    }

    async getFileContentAtCommit(hash: string, filePath: string): Promise<string> {
        return this.fileOps.getFileContentAtCommit(hash, filePath);
    }

    async getMultiCommitFiles(commitHashes: string[]): Promise<FileChange[]> {
        return this.fileOps.getMultiCommitFiles(commitHashes);
    }

    async getMultiCommitDiff(commitHashes: string[]): Promise<string> {
        return this.fileOps.getMultiCommitDiff(commitHashes);
    }

    async getCommitDetailsWithCompare(hash: string, compareBranch: string): Promise<Commit | null> {
        const result = await this.fileOps.getCommitDetailsWithCompare(hash, compareBranch);
        if (result && result.commit && result.files) {
            result.commit.files = result.files;
            return result.commit;
        }
        return result?.commit || null;
    }

    async getCommitDetailsWithWorking(hash: string): Promise<Commit | null> {
        const result = await this.fileOps.getCommitDetailsWithWorking(hash);
        if (result && result.commit && result.files) {
            result.commit.files = result.files;
            return result.commit;
        }
        return result?.commit || null;
    }

    async getMultiCommitFilesWithCompare(hashes: string[], compareBranch: string): Promise<FileChange[]> {
        return this.fileOps.getMultiCommitFilesWithCompare(hashes, compareBranch);
    }

    async getMultiCommitFilesWithWorking(hashes: string[]): Promise<FileChange[]> {
        return this.fileOps.getMultiCommitFilesWithWorking(hashes);
    }

    async getFileChangesWithCompare(hash: string, compareBranch: string): Promise<FileChange[]> {
        return this.fileOps.getFileChangesWithCompare(hash, compareBranch);
    }

    async getFileChangesWithWorking(hash: string): Promise<FileChange[]> {
        return this.fileOps.getFileChangesWithWorking(hash);
    }

    // Working Directory Operations
    async getStatus(): Promise<any> {
        return this.workingDirOps.getStatus();
    }

    async hasUncommittedChanges(): Promise<boolean> {
        return this.workingDirOps.hasUncommittedChanges();
    }

    async getUncommittedChanges(): Promise<FileChange[]> {
        return this.workingDirOps.getUncommittedChanges();
    }

    async commitChanges(message: string): Promise<boolean> {
        return this.workingDirOps.commitChanges(message);
    }

    async isGitRepository(): Promise<boolean> {
        return this.workingDirOps.isGitRepository();
    }

    getRepoRoot(): string {
        return this.workingDirOps.getRepoRoot();
    }
}
