import { SimpleGit } from 'simple-git';
import { Branch, Commit, FileChange, Stash } from './gitInterfaces';
import { BranchOperations } from './operations/BranchOperations';
import { CommitOperations } from './operations/CommitOperations';
import { FileOperations } from './operations/FileOperations';
import { WorkingDirectoryOperations } from './operations/WorkingDirectoryOperations';
import { StashOperations } from './operations/StashOperations';

export class GitOperations {
    private branchOps: BranchOperations;
    private commitOps: CommitOperations;
    private fileOps: FileOperations;
    private workingDirOps: WorkingDirectoryOperations;
    private stashOps: StashOperations;

    constructor(private git: SimpleGit) {
        this.branchOps = new BranchOperations(git);
        this.commitOps = new CommitOperations(git);
        this.fileOps = new FileOperations(git);
        this.workingDirOps = new WorkingDirectoryOperations(git);
        this.stashOps = new StashOperations(git);
        
        // Debug: Check what repository we're working with
        this.git.revparse(['--show-toplevel']).then(root => {
            console.log('🚀🚀🚀 GitOperations: Working with repository root:', root);
        }).catch(err => {
            console.log('🚀🚀🚀 GitOperations: Not a git repository or error getting root:', err);
        });
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

    async fileExistsAtCommit(hash: string, filePath: string): Promise<boolean> {
        return this.fileOps.fileExistsAtCommit(hash, filePath);
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

    async hasStagedChanges(): Promise<boolean> {
        return this.workingDirOps.hasStagedChanges();
    }

    async getStagedChanges(): Promise<FileChange[]> {
        return this.workingDirOps.getStagedChanges();
    }

    async stageAllChanges(): Promise<boolean> {
        return this.workingDirOps.stageAllChanges();
    }

    async stageFile(filePath: string): Promise<boolean> {
        return this.workingDirOps.stageFile(filePath);
    }

    async unstageAllChanges(): Promise<boolean> {
        return this.workingDirOps.unstageAllChanges();
    }

    async unstageFile(filePath: string): Promise<boolean> {
        return this.workingDirOps.unstageFile(filePath);
    }

    async revertFile(filePath: string): Promise<boolean> {
        return this.workingDirOps.revertFile(filePath);
    }

    async stashChanges(message?: string): Promise<boolean> {
        return this.workingDirOps.stashChanges(message);
    }

    async commitChanges(message: string): Promise<boolean> {
        return this.workingDirOps.commitChanges(message);
    }

    async commitStagedChanges(message: string): Promise<boolean> {
        return this.workingDirOps.commitStagedChanges(message);
    }

    async commitAndPushStagedChanges(message: string): Promise<boolean> {
        return this.workingDirOps.commitAndPushStagedChanges(message);
    }

    async pushCommit(commitHash: string): Promise<boolean> {
        return this.workingDirOps.pushCommit(commitHash);
    }

    async isGitRepository(): Promise<boolean> {
        return this.workingDirOps.isGitRepository();
    }

    getRepoRoot(): string {
        return this.workingDirOps.getRepoRoot();
    }

    async discardAllChanges(): Promise<boolean> {
        return this.workingDirOps.discardAllChanges();
    }

    async getWorkingChanges(): Promise<{ uncommitted: FileChange[], staged: FileChange[] }> {
        return this.workingDirOps.getWorkingChanges();
    }

    // Stash Operations
    async getStashes(): Promise<Stash[]> {
        return this.stashOps.getStashes();
    }

    async applyStash(stashName: string): Promise<boolean> {
        return this.stashOps.applyStash(stashName);
    }

    async popStash(stashName: string): Promise<boolean> {
        return this.stashOps.popStash(stashName);
    }

    async dropStash(stashName: string): Promise<boolean> {
        return this.stashOps.dropStash(stashName);
    }

    async createBranchFromStash(stashName: string, branchName: string): Promise<boolean> {
        return this.stashOps.createBranchFromStash(stashName, branchName);
    }

    async showStash(stashName: string): Promise<string> {
        return this.stashOps.showStash(stashName);
    }

    async getStashFiles(stashName: string): Promise<FileChange[]> {
        return this.stashOps.getStashFiles(stashName);
    }
}
