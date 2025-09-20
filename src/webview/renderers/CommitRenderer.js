// Commit Renderer - Handles commit-related HTML generation
class CommitRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    generateCommitsHtml(commits, searchTerm = '', selectedUser = 'all', hasUncommittedChanges = false, hasStagedChanges = false) {
        let html = '';

        // Add uncommitted changes if they exist and we're on the current branch
        const isOnCurrentBranch = !this.panel.currentBranch || this.panel.isCurrentBranch();
        console.log('Uncommitted changes check:', {
            hasUncommittedChanges: hasUncommittedChanges,
            hasStagedChanges: hasStagedChanges,
            currentBranch: this.panel.currentBranch,
            isOnCurrentBranch: isOnCurrentBranch,
            branches: this.panel.branches?.map(b => ({ name: b.name, isCurrent: b.isCurrent }))
        });
        
        if ((hasUncommittedChanges || hasStagedChanges) && isOnCurrentBranch) {
            html += `
                <div class="commit-item uncommitted-changes" 
                     onclick="selectUncommittedChanges()" 
                     oncontextmenu="event.preventDefault(); showUncommittedChangesContextMenu(event)">
                    <div class="commit-graph">
                        <div class="dag-commit dag-uncommitted"></div>
                    </div>
                    <div class="commit-content">
                        <div>
                            <span class="commit-hash has-tooltip" data-full-hash="Uncommitted Changes" title="Uncommitted Changes">📝</span>
                            <span class="commit-message has-tooltip" data-full-message="Uncommitted Changes" title="Uncommitted Changes">Uncommitted Changes</span>
                        </div>
                        <div class="commit-meta">
                            <span class="commit-author has-tooltip" data-full-author="Working Directory" title="Working Directory">Working Directory</span>
                            <span class="commit-date">Now</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!commits || commits.length === 0) {
            if (html) {
                return html;
            }
            return '<div class="empty-state"><h3>No commits found</h3></div>';
        }

        // Filter commits based on search term and user
        let filteredCommits = commits;
        
        if (searchTerm.length > 0) {
            filteredCommits = filteredCommits.filter(commit => 
                commit.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (selectedUser !== 'all') {
            filteredCommits = filteredCommits.filter(commit => 
                commit.author === selectedUser
            );
        }

        if (filteredCommits.length === 0) {
            if (html) {
                return html;
            }
            return '<div class="empty-state"><h3>No commits match your filters</h3></div>';
        }

        // Generate commit items
        html += filteredCommits.map(commit => {
            const isSelected = this.panel.selectedCommits.has(commit.hash);
            const selectedClass = isSelected ? 'selected' : '';
            const isLocalCommit = commit.isLocal || false;
            const localClass = isLocalCommit ? 'local-commit' : '';
            
            return `
                <div class="commit-item ${selectedClass} ${localClass}" 
                     data-commit-hash="${commit.hash}"
                     onclick="selectCommit('${commit.hash}', event)" 
                     oncontextmenu="event.preventDefault(); showCommitContextMenu(event, '${commit.hash}', ${isLocalCommit})">
                    <div class="commit-graph">
                        <div class="dag-commit"></div>
                    </div>
                    <div class="commit-content">
                        <div>
                            <span class="commit-hash has-tooltip" data-full-hash="${commit.hash}" title="${commit.hash}">${commit.shortHash}</span>
                            <span class="commit-message has-tooltip" data-full-message="${this.escapeHtml(commit.message)}" title="${this.escapeHtml(commit.message)}">${this.escapeHtml(commit.message)}</span>
                            ${isLocalCommit ? '<span class="local-indicator" title="Local commit (not pushed)">🚀</span>' : ''}
                        </div>
                        <div class="commit-meta">
                            <span class="commit-author has-tooltip" data-full-author="${this.escapeHtml(commit.author)}" title="${this.escapeHtml(commit.author)}">${this.escapeHtml(commit.author)}</span>
                            <span class="commit-date">${this.formatDate(commit.date)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return html;
    }

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
