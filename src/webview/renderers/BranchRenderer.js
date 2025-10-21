// Branch Renderer - Handles branch-related HTML generation
class BranchRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    generateBranchesHtml(branches, stashes, selectedBranch, searchTerm = '') {
        if (!branches || branches.length === 0) {
            return '<div class="empty-state"><h3>No branches found</h3></div>';
        }

        // Filter branches based on search term
        let filteredBranches = branches;
        if (searchTerm.length > 0) {
            filteredBranches = branches.filter(branch => 
                branch.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Find current branch
        const currentBranch = filteredBranches.find(branch => branch.isCurrent);
        
        // Separate local and remote branches (excluding current branch)
        const localBranches = filteredBranches.filter(branch => !branch.isRemote && !branch.isCurrent);
        const remoteBranches = filteredBranches.filter(branch => branch.isRemote);

        // Group remote branches by origin
        const remoteGroups = {};
        remoteBranches.forEach(branch => {
            const origin = branch.name.split('/')[0];
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
                    <div class="tree-section-header">
                        <div class="tree-section-title">Current</div>
                    </div>
                    <div class="tree-section-content" id="current-content">
                        ${this.generateBranchItemsHtml([currentBranch], selectedBranch)}
                    </div>
                </div>
            `;
        }

        // Stashes section
        if (stashes && stashes.length > 0) {
            html += `
                <div class="tree-section">
                    <div class="tree-section-header">
                        <div class="tree-section-title">Stashes</div>
                    </div>
                    <div class="tree-section-content" id="stashes-content">
                        ${this.generateStashItemsHtml(stashes)}
                    </div>
                </div>
            `;
        }

        // Local branches section
        if (localBranches.length > 0) {
            html += `
                <div class="tree-section">
                    <div class="tree-section-header">
                        <div class="tree-section-title">Local</div>
                    </div>
                    <div class="tree-section-content" id="local-content">
                        ${this.generateBranchItemsHtml(localBranches, selectedBranch)}
                    </div>
                </div>
            `;
        }

        // Remote branches sections
        Object.keys(remoteGroups).sort().forEach(origin => {
            const originBranches = remoteGroups[origin];
            html += `
                <div class="tree-section">
                    <div class="tree-section-header">
                        <div class="tree-section-subtitle">${origin}</div>
                    </div>
                    <div class="tree-section-content" id="${origin}-content">
                        ${this.generateBranchItemsHtml(originBranches, selectedBranch)}
                    </div>
                </div>
            `;
        });

        // If we have a search term but no results in any section, show message
        if (searchTerm.length > 0 && !currentBranch && localBranches.length === 0 && Object.keys(remoteGroups).length === 0) {
            html = `<div class="empty-state"><h3>No branches match "${searchTerm}"</h3></div>`;
        }

        return html;
    }

    generateStashItemsHtml(stashes) {
        return stashes.map(stash => {
            const displayMessage = stash.message || `On ${stash.branch}: ${stash.commitSubject}`;
            
            return `
                <div class="stash-item" 
                     onclick="selectStash('${stash.name}')" 
                     oncontextmenu="event.preventDefault(); showStashContextMenu(event, '${stash.name}')">
                    <div class="branch-icon">📦</div>
                    <div class="stash-info">
                        <div class="stash-name">${stash.name}</div>
                        <div class="stash-message">${displayMessage}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateBranchItemsHtml(branches, selectedBranch) {
        return branches.map(branch => {
            const isSelected = (selectedBranch && branch.name === selectedBranch);
            const isCurrent = branch.isCurrent;
            const highlightClass = isSelected ? 'selected' : '';
            const currentClass = isCurrent ? 'current' : '';
            const typeIcon = branch.isRemote ? '🌐' : (isCurrent ? '' : '');
            const refs = branch.ahead || branch.behind ? 
                `+${branch.ahead || 0} -${branch.behind || 0}` : '';

            // For remote branches, show only the branch name without origin
            const displayName = branch.isRemote ? branch.name.split('/').slice(1).join('/') : branch.name;

            return `
                <div class="branch-item ${highlightClass} ${currentClass}" 
                     onclick="selectBranch('${branch.name}')" 
                     oncontextmenu="event.preventDefault(); showBranchContextMenu(event, '${branch.name}')">
                    <div class="branch-icon">
                        ${isCurrent ? 
                            `<img class="panel-icon" data-icon="git-current-branch" alt="Current Branch" style="width: 16px; height: 16px; margin-right: 0;" />` : 
                            (branch.isRemote ? typeIcon : `<img class="panel-icon" data-icon="git-local-branch" alt="Local Branch" style="width: 16px; height: 16px; margin-right: 0;" />`)
                        }
                    </div>
                    <div class="branch-name">${displayName}</div>
                    <div class="branch-refs">${refs}</div>
                </div>
            `;
        }).join('');
    }

}
