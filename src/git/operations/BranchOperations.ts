import { SimpleGit } from 'simple-git';
import { Branch } from '../gitInterfaces';

export class BranchOperations {
    constructor(private git: SimpleGit) {}

    async getBranches(): Promise<Branch[]> {
        try {
            const branches = await this.git.branch(['-a']);
            const branchList: Branch[] = [];
            
            for (const branchName in branches.branches) {
                const branch = branches.branches[branchName];
                const isLocal = !branchName.includes('remotes/');
                const isRemote = branchName.includes('remotes/');
                const cleanName = isRemote ? branchName.replace('remotes/', '') : branchName;
                
                // Skip HEAD reference
                if (cleanName === 'HEAD') continue;
                
                branchList.push({
                    name: cleanName,
                    isLocal,
                    isRemote,
                    isCurrent: branch.current || false,
                    commit: branch.commit,
                    ahead: (branch as any).ahead || 0,
                    behind: (branch as any).behind || 0
                });
            }
            
            return branchList.sort((a, b) => {
                // Sort current branch first, then local branches, then remote branches
                if (a.isCurrent && !b.isCurrent) return -1;
                if (!a.isCurrent && b.isCurrent) return 1;
                if (a.isLocal && !b.isLocal) return -1;
                if (!a.isLocal && b.isLocal) return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (error) {
            console.error('Error getting branches:', error);
            return [];
        }
    }

    async getCurrentBranch(): Promise<string> {
        try {
            const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
            return branch.trim();
        } catch (error) {
            console.error('Error getting current branch:', error);
            return '';
        }
    }

    async checkoutBranch(branchName: string): Promise<boolean> {
        try {
            if (branchName.startsWith('remotes/')) {
                const localBranchName = branchName.replace('remotes/origin/', '');
                await this.git.checkout(['-b', localBranchName, branchName]);
            } else {
                await this.git.checkout(branchName);
            }
            return true;
        } catch (error) {
            console.error('Error checking out branch:', error);
            return false;
        }
    }

    async createBranch(branchName: string, fromBranch?: string): Promise<boolean> {
        try {
            if (fromBranch) {
                await this.git.checkoutBranch(branchName, fromBranch);
            } else {
                await this.git.branch([branchName]);
            }
            return true;
        } catch (error) {
            console.error('Error creating branch:', error);
            return false;
        }
    }

    async deleteBranch(branchName: string, force: boolean = false): Promise<boolean> {
        try {
            if (branchName.startsWith('remotes/')) {
                const remoteName = branchName.split('/')[1];
                const branchToDelete = branchName.split('/').slice(2).join('/');
                await this.git.push([remoteName, '--delete', branchToDelete]);
            } else {
                await this.git.deleteLocalBranch(branchName, force);
            }
            return true;
        } catch (error) {
            console.error('Error deleting branch:', error);
            return false;
        }
    }

    async mergeBranch(branchName: string): Promise<boolean> {
        try {
            await this.git.mergeFromTo(branchName, await this.getCurrentBranch());
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
}
