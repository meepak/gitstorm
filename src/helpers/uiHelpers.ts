export interface Branch {
    name: string;
    isLocal: boolean;
    isRemote: boolean;
    isCurrent: boolean;
    commit: string;
    ahead?: number;
    behind?: number;
}

export interface Commit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: Date;
    parents: string[];
    refs: string[];
}

export function getBranchesHtml(branches: Branch[], selectedBranch: string | null = null, searchTerm: string = ''): string {
        if (!branches || branches.length === 0) {
            return '<div class="empty-state"><h3>No branches found</h3></div>';
        }

        // Filter branches based on search term
        const filteredBranches = branches.filter(branch => 
            branch.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Find current branch
        const currentBranch = filteredBranches.find(branch => branch.isCurrent);
        
        // Separate local and remote branches (excluding current branch)
        const localBranches = filteredBranches.filter(branch => branch.isLocal && !branch.isRemote && !branch.isCurrent);
        const remoteBranches = filteredBranches.filter(branch => branch.isRemote);

        // Group remote branches by origin
        const remoteGroups: { [origin: string]: Branch[] } = {};
        remoteBranches.forEach(branch => {
            const parts = branch.name.split('/');
            const origin = parts[0] || 'origin';
            if (!remoteGroups[origin]) {
                remoteGroups[origin] = [];
            }
            remoteGroups[origin].push(branch);
        });

        let html = '';

        // Current branch section (at the top)
        if (currentBranch) {
            html += `
                <div class="tree-section">
                    <div class="tree-section-header" onclick="toggleSection('current')">
                        <div class="tree-toggle">▼</div>
                        <div class="tree-section-title">Current</div>
                    </div>
                    <div class="tree-section-content" id="current-content">
                        ${generateBranchItemsHtml([currentBranch], selectedBranch)}
                    </div>
                </div>
            `;
        }

        // Local branches section
        if (localBranches.length > 0) {
            html += `
                <div class="tree-section">
                    <div class="tree-section-header" onclick="toggleSection('local')">
                        <div class="tree-toggle">▼</div>
                        <div class="tree-section-title">Local</div>
                    </div>
                    <div class="tree-section-content" id="local-content">
                        ${generateBranchItemsHtml(localBranches, selectedBranch)}
                    </div>
                </div>
            `;
        }

        // Remote branches sections
        Object.keys(remoteGroups).sort().forEach(origin => {
            const originBranches = remoteGroups[origin];
            html += `
                <div class="tree-section">
                    <div class="tree-section-header" onclick="toggleSection('${origin}')">
                        <div class="tree-toggle">▼</div>
                        <div class="tree-section-title">Remote</div>
                        <div class="tree-section-subtitle">${origin}</div>
                    </div>
                    <div class="tree-section-content" id="${origin}-content">
                        ${generateBranchItemsHtml(originBranches, selectedBranch)}
                    </div>
                </div>
            `;
        });

        return html;
    }

function generateBranchItemsHtml(branches: Branch[], selectedBranch: string | null = null): string {
        return branches.map(branch => {
            const isSelected = (selectedBranch && branch.name === selectedBranch) || 
                              (!selectedBranch && branch.isCurrent);
            const highlightClass = isSelected ? 'current' : '';
            const typeIcon = branch.isRemote ? '🌐' : '🌿';
            const refs = branch.ahead || branch.behind ? 
                `+${branch.ahead || 0} -${branch.behind || 0}` : '';

            // For remote branches, show only the branch name without origin
            const displayName = branch.isRemote ? branch.name.split('/').slice(1).join('/') : branch.name;

            return `
                <div class="branch-item ${highlightClass}" onclick="selectBranch('${branch.name}')">
                    <div class="branch-icon">${typeIcon}</div>
                    <div class="branch-name">${displayName}</div>
                    <div class="branch-refs">${refs}</div>
                </div>
            `;
        }).join('');
    }

export function getCommitsHtml(commits: Commit[]): string {
        if (!commits || commits.length === 0) {
            return '<div class="empty-state"><h3>No commits found</h3></div>';
        }

        return commits.map(commit => {
            let date = 'Invalid Date';
            try {
                if (commit.date) {
                    const dateObj = new Date(commit.date);
                    if (!isNaN(dateObj.getTime())) {
                        date = dateObj.toLocaleDateString();
                    }
                }
            } catch (e) {
                console.error('Date parsing error:', e);
            }
            
            const refs = commit.refs ? commit.refs.join(', ') : '';

            return `
                <div class="commit-item" onclick="selectCommit('${commit.hash}')">
                    <div class="commit-graph">●</div>
                    <div class="commit-content">
                        <div>
                            <span class="commit-hash">${commit.shortHash}</span>
                            <span class="commit-message">${commit.message}</span>
                        </div>
                        <div class="commit-meta">
                            <span>${commit.author}</span>
                            <span>${date}</span>
                            <span>${refs}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

export function getFilesHtml(files: any[]): string {
    if (!files || files.length === 0) {
        return '<div class="empty-state"><h3>No files changed</h3></div>';
    }

    return files.map(file => {
        const statusIcon = file.status === 'M' ? 'M' : 
                          file.status === 'A' ? 'A' : 
                          file.status === 'D' ? 'D' : 
                          file.status === 'R' ? 'R' : '?';
        const statusClass = file.status === 'M' ? 'modified' : 
                           file.status === 'A' ? 'added' : 
                           file.status === 'D' ? 'deleted' : 
                           file.status === 'R' ? 'renamed' : 'unknown';

        return `
            <div class="file-item ${statusClass}" onclick="selectFile('${file.file}')">
                <div class="file-status">${statusIcon}</div>
                <div class="file-name">${file.file}</div>
            </div>
        `;
    }).join('');
}
