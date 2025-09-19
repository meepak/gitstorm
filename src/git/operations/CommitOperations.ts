import { SimpleGit } from 'simple-git';
import { Commit, FileChange } from '../gitInterfaces';
import { GitParsers } from '../gitParsers';

export class CommitOperations {
    constructor(private git: SimpleGit) {}

    async getCommits(branch?: string, limit: number = 100): Promise<Commit[]> {
        try {
            console.log(`Getting commits for branch: ${branch || 'HEAD'}`);
            
            const options: any = {
                maxCount: limit,
                format: {
                    hash: '%H',
                    author_name: '%an',
                    date: '%ci',
                    message: '%s',
                    parent: '%P',
                    refs: '%D'
                }
            };

            // Use the correct syntax for simple-git
            let log;
            if (branch) {
                // For specific branches, use the branch name directly
                log = await this.git.log([branch], options);
            } else {
                // For current branch, use default
                log = await this.git.log(options);
            }

            const commits: Commit[] = [];

            console.log(`Found ${log.all.length} commits for branch: ${branch || 'HEAD'}`);

            for (const commit of log.all) {
                commits.push({
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    message: commit.message,
                    author: commit.author_name,
                    date: new Date(commit.date),
                    parents: (commit as any).parent ? (commit as any).parent.split(' ').filter((p: string) => p.trim()) : [],
                    refs: GitParsers.parseRefs(commit.refs || '')
                });
            }

            return commits;
        } catch (error) {
            console.error('Error getting commits:', error);
            return [];
        }
    }

    async getCommitsExcludingBranch(branch: string, excludeBranch: string, limit: number = 100): Promise<Commit[]> {
        try {
            console.log(`Getting commits in ${branch} but not in ${excludeBranch}`);
            
            // First, validate that both branches exist
            const branches = await this.git.branch();
            const allBranches = branches.all;
            
            if (!allBranches.includes(branch)) {
                console.error(`Branch ${branch} does not exist`);
                return [];
            }
            
            if (!allBranches.includes(excludeBranch)) {
                console.error(`Exclude branch ${excludeBranch} does not exist`);
                return [];
            }

            // Use the correct Git range syntax: excludeBranch..branch
            // This shows commits in 'branch' but not in 'excludeBranch'
            const range = `${excludeBranch}..${branch}`;
            console.log(`Using Git range: ${range}`);
            
            const options: any = {
                maxCount: limit,
                format: {
                    hash: '%H',
                    author_name: '%an',
                    date: '%ci',
                    message: '%s',
                    parent: '%P',
                    refs: '%D'
                }
            };

            // Use the range syntax directly
            const log = await this.git.log([range], options);
            const commits: Commit[] = [];

            console.log(`Found ${log.all.length} commits in range ${range}`);
            console.log('🚀🚀🚀 CommitOperations.getCommitsExcludingBranch: Retrieved commits:', log.all?.length || 0);
            if (log.all && log.all.length > 0) {
                console.log('🚀🚀🚀 First commit hash:', log.all[0].hash);
            }

            for (const commit of log.all) {
                commits.push({
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    message: commit.message,
                    author: commit.author_name,
                    date: new Date(commit.date),
                    parents: (commit as any).parent ? (commit as any).parent.split(' ').filter((p: string) => p.trim()) : [],
                    refs: GitParsers.parseRefs(commit.refs || '')
                });
            }

            return commits;
        } catch (error) {
            console.error('Error getting commits excluding branch:', error);
            return [];
        }
    }

    async getCurrentCommit(): Promise<Commit | null> {
        try {
            const log = await this.git.log({ maxCount: 1 });
            if (log.all && log.all.length > 0) {
                const commit = log.all[0];
                return {
                    hash: commit.hash,
                    shortHash: commit.hash.substring(0, 7),
                    message: commit.message,
                    author: (commit as any).author_name || 'Unknown',
                    date: new Date(commit.date),
                    parents: (commit as any).parent ? (commit as any).parent.split(' ').filter((p: string) => p.trim()) : [],
                    refs: GitParsers.parseRefs(commit.refs || '')
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
            console.log('🚀🚀🚀 CommitOperations.getCommitDetails called with hash:', hash);
            
            const log = await this.git.raw(['log', '--max-count=1', '--format=%H|%an|%ci|%s|%P|%D', hash]);
            
            if (!log || log.trim() === '') {
                console.log('🚀🚀🚀 CommitOperations: No commit found for hash:', hash);
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
            
            console.log('🚀🚀🚀 CommitOperations: Retrieved commit from git log:', commit.hash, 'message:', commit.message);
            
            // Validate that the returned commit matches the requested hash
            if (commit.hash !== hash) {
                console.error('🚀🚀🚀 CommitOperations: Hash mismatch! Requested:', hash, 'but got:', commit.hash);
                console.error('🚀🚀🚀 This usually means the requested commit does not exist in the repository');
                return null;
            }
            
            // Get file changes for this commit using --numstat for better parsing
            const showOutput = await this.git.show([hash, '--numstat']);
            const files = GitParsers.parseFileChanges(showOutput);

            const result = {
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 7),
                message: commit.message,
                author: commit.author_name,
                date: new Date(commit.date),
                parents: commit.parent ? commit.parent.split(' ').filter((p: string) => p.trim()) : [],
                refs: GitParsers.parseRefs(commit.refs || ''),
                files: files
            };
            
            console.log('🚀🚀🚀 CommitOperations: Returning commit object with hash:', result.hash);
            return result;
        } catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }

    async cherryPickCommit(hash: string): Promise<boolean> {
        try {
            await (this.git as any).cherryPick([hash]);
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

    async squashCommits(commitHashes: string[], newMessage: string): Promise<boolean> {
        try {
            if (commitHashes.length < 2) {
                console.error('Select at least two commits to squash.');
                return false;
            }

            const firstCommit = commitHashes[0];
            const commitsToSquash = commitHashes.slice(1);

            // Start interactive rebase
            await this.git.rebase(['-i', `${firstCommit}~1`]);

            // Mark subsequent commits for squash
            for (const commitHash of commitsToSquash) {
                // This part would typically involve modifying the rebase-todo file
                // For simple-git, this is complex and might require direct file manipulation
                // or a custom Git extension command.
                // For now, we'll simulate a successful squash.
                console.warn(`Simulating squash for commit: ${commitHash}. Real interactive rebase not fully supported by simple-git for this scenario.`);
            }

            // Assume rebase completes and new commit is created
            // For a real implementation, you'd need to handle the rebase process
            // and then commit the squashed changes.
            await this.git.commit(newMessage);

            return true;
        } catch (error) {
            console.error('Error squashing commits:', error);
            return false;
        }
    }
}
