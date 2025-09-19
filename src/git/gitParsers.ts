import { FileChange } from './gitInterfaces';

export class GitParsers {
    static parseRawGitLog(rawOutput: string): any {
        const commits: any[] = [];
        const lines = rawOutput.trim().split('\n');
        
        for (const line of lines) {
            if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 4) {
                    commits.push({
                        hash: parts[0],
                        author_name: parts[1],
                        date: parts[2],
                        message: parts[3],
                        parent: parts[4] || '',
                        refs: ''
                    });
                }
            }
        }
        
        return { all: commits };
    }

    static parseRefs(refs: string): string[] {
        if (!refs) return [];
        return refs.split(', ').filter(ref => ref.trim() !== '');
    }

    static parseFileChanges(showOutput: string): FileChange[] {
        const files: FileChange[] = [];
        const lines = showOutput.split(/\r?\n/);
    
        for (const raw of lines) {
            const line = raw.trimEnd();
    
            // Skip empty lines
            if (!line) continue;
    
            // Stop at the summary line like: "3 files changed, 12 insertions(+), 2 deletions(-)"
            if (/^\s*\d+\s+files?\s+changed\b/i.test(line)) break;
    
            // Handle --numstat format: "additions	deletions	filename"
            const numstatMatch = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
            if (numstatMatch) {
                const additions = parseInt(numstatMatch[1], 10);
                const deletions = parseInt(numstatMatch[2], 10);
                const file = numstatMatch[3];
                const changes = additions + deletions;
                
                // Determine status based on additions/deletions
                let status: 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?' = 'M';
                if (deletions === 0 && additions > 0) {
                    status = 'A'; // Added file
                } else if (additions === 0 && deletions > 0) {
                    status = 'D'; // Deleted file
                }
                
                files.push({
                    file: file,
                    additions: additions,
                    deletions: deletions,
                    changes: changes,
                    status: status
                });
                continue;
            }
    
            // Handle --stat format: "filename | X ++Y --Z"
            if (line.indexOf('|') !== -1) {
                const [filePartRaw, statsRaw] = line.split('|');
                if (!statsRaw) continue;
    
                // Clean file segment
                const filePart = filePartRaw.replace(/\s+\([^)]+\)\s*$/, '').trim();
                const file = filePart;
                const statsPart = statsRaw.trim();
    
                let additions = 0;
                let deletions = 0;
                let changes = 0;
    
                // Binary changes: "Bin 0 -> 123 bytes"
                if (/^Bin\b/i.test(statsPart)) {
                    changes = 0;
                } else {
                    // First integer is the total changed lines for this file
                    const totalMatch = statsPart.match(/^(\d+)/);
                    if (totalMatch) {
                        changes = parseInt(totalMatch[1], 10);
                    }
    
                    // Extract additions and deletions - try multiple patterns
                    const additionsMatch = statsPart.match(/(\d+)\s+insertions?\(\+\)/) || 
                                         statsPart.match(/(\d+)\s*\+/);
                    if (additionsMatch) {
                        additions = parseInt(additionsMatch[1], 10);
                    }
    
                    const deletionsMatch = statsPart.match(/(\d+)\s+deletions?\(-\)/) || 
                                          statsPart.match(/(\d+)\s*\-/);
                    if (deletionsMatch) {
                        deletions = parseInt(deletionsMatch[1], 10);
                    }
                    
                    // If we have changes but no additions/deletions, try to estimate
                    if (changes > 0 && additions === 0 && deletions === 0) {
                        // Simple heuristic: assume 50/50 split if we can't parse
                        additions = Math.floor(changes / 2);
                        deletions = changes - additions;
                    }
                }
    
                // Try to detect status from the file part or stats
                let status: 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?' = 'M'; // default to modified
                
                // Check if file was added (no deletions, only additions)
                if (deletions === 0 && additions > 0 && changes === additions) {
                    status = 'A';
                }
                // Check if file was deleted (no additions, only deletions)
                else if (additions === 0 && deletions > 0 && changes === deletions) {
                    status = 'D';
                }
                // Check for binary files
                else if (/^Bin\b/i.test(statsPart)) {
                    status = 'M';
                }
                // Try to parse from file part if it contains status info
                else {
                    status = this.parseFileStatus(filePartRaw);
                }
                
                files.push({
                    file: file,
                    additions: additions,
                    deletions: deletions,
                    changes: changes,
                    status: status
                });
            }
        }
    
        return files;
    }

    static parseFileStatus(status: string): 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?' {
        if (status === 'A' || status.includes('added')) return 'A';
        if (status === 'D' || status.includes('deleted')) return 'D';
        if (status === 'R' || status.includes('renamed')) return 'R';
        if (status === 'C') return 'C';
        if (status === 'U') return 'U';
        if (status === '?') return '?';
        return 'M';
    }

    static parseDiffOutput(diffOutput: string): FileChange[] {
        const files: FileChange[] = [];
        const lines = diffOutput.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const status = this.parseFileStatus(parts[0]);
                const file = parts[1];
                
                files.push({
                    file: file,
                    status: status,
                    additions: 0,
                    deletions: 0,
                    changes: 0
                });
            }
        }
        
        return files;
    }
}
