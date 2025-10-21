import { SimpleGit } from 'simple-git';
import { Stash } from '../gitInterfaces';

export class StashOperations {
    constructor(private git: SimpleGit) {}

    async getStashes(): Promise<Stash[]> {
        try {
            // Get stash list
            const stashListOutput = await this.git.stashList();
            console.log('Raw stash list output:', stashListOutput);

            const stashes: Stash[] = [];
            
            if (!stashListOutput || !stashListOutput.all) {
                console.log('No stashes found');
                return [];
            }

            for (let i = 0; i < stashListOutput.all.length; i++) {
                const stashEntry = stashListOutput.all[i];
                console.log('Processing stash entry:', stashEntry);
                
                // Parse the stash entry
                const stashName = `stash@{${i}}`;
                const message = stashEntry.message || '';
                const hash = stashEntry.hash || '';
                
                // Get the branch name and commit subject from the message
                // Format is usually: "WIP on branch_name: commit_hash commit_subject"
                // or: "On branch_name: custom_message"
                let branch = '';
                let commitSubject = '';
                let stashMessage = message;
                
                const wipMatch = message.match(/WIP on ([^:]+):\s*(.+)/);
                const onMatch = message.match(/On ([^:]+):\s*(.+)/);
                
                if (wipMatch) {
                    branch = wipMatch[1];
                    commitSubject = wipMatch[2];
                    stashMessage = `WIP on ${branch}`;
                } else if (onMatch) {
                    branch = onMatch[1];
                    stashMessage = onMatch[2];
                    commitSubject = onMatch[2];
                } else {
                    // Try to extract branch from the message
                    stashMessage = message;
                    commitSubject = message;
                }

                stashes.push({
                    index: i,
                    name: stashName,
                    message: stashMessage,
                    branch,
                    commit: hash,
                    commitSubject
                });
            }

            console.log('Parsed stashes:', stashes);
            return stashes;
        } catch (error) {
            console.error('Error getting stashes:', error);
            return [];
        }
    }

    async applyStash(stashName: string): Promise<boolean> {
        try {
            await this.git.stash(['apply', stashName]);
            return true;
        } catch (error) {
            console.error('Error applying stash:', error);
            throw error;
        }
    }

    async popStash(stashName: string): Promise<boolean> {
        try {
            await this.git.stash(['pop', stashName]);
            return true;
        } catch (error) {
            console.error('Error popping stash:', error);
            throw error;
        }
    }

    async dropStash(stashName: string): Promise<boolean> {
        try {
            await this.git.stash(['drop', stashName]);
            return true;
        } catch (error) {
            console.error('Error dropping stash:', error);
            throw error;
        }
    }

    async createBranchFromStash(stashName: string, branchName: string): Promise<boolean> {
        try {
            await this.git.stash(['branch', branchName, stashName]);
            return true;
        } catch (error) {
            console.error('Error creating branch from stash:', error);
            throw error;
        }
    }

    async showStash(stashName: string): Promise<string> {
        try {
            const result = await this.git.stash(['show', '-p', stashName]);
            return result;
        } catch (error) {
            console.error('Error showing stash:', error);
            return '';
        }
    }

    async getStashFiles(stashName: string): Promise<any[]> {
        try {
            // Get the list of files changed in the stash
            const output = await this.git.raw(['stash', 'show', '--name-status', stashName]);
            const lines = output.trim().split('\n').filter(line => line.trim() !== '');
            
            const files = lines.map(line => {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const status = parts[0];
                    const file = parts[1];
                    return {
                        file,
                        status: status as 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?',
                        additions: 0,
                        deletions: 0,
                        changes: 0
                    };
                }
                return null;
            }).filter(f => f !== null);

            // Get detailed stats for each file
            const statsOutput = await this.git.raw(['stash', 'show', '--numstat', stashName]);
            const statsLines = statsOutput.trim().split('\n').filter(line => line.trim() !== '');
            
            statsLines.forEach(line => {
                const parts = line.split('\t');
                if (parts.length >= 3) {
                    const additions = parseInt(parts[0]) || 0;
                    const deletions = parseInt(parts[1]) || 0;
                    const fileName = parts[2];
                    
                    const file = files.find(f => f?.file === fileName);
                    if (file) {
                        file.additions = additions;
                        file.deletions = deletions;
                        file.changes = additions + deletions;
                    }
                }
            });

            return files;
        } catch (error) {
            console.error('Error getting stash files:', error);
            return [];
        }
    }
}

