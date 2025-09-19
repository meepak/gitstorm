// UI Renderer - Main orchestrator for all HTML generation and UI updates
class UIRenderer {
    constructor(panelController) {
        this.panel = panelController;
        
        console.log('UIRenderer constructor called, checking for specialized renderers...');
        console.log('BranchRenderer available:', typeof BranchRenderer !== 'undefined');
        console.log('CommitRenderer available:', typeof CommitRenderer !== 'undefined');
        console.log('FileChangesRenderer available:', typeof FileChangesRenderer !== 'undefined');
        console.log('FilterRenderer available:', typeof FilterRenderer !== 'undefined');
        console.log('IconRenderer available:', typeof IconRenderer !== 'undefined');
        
        // Initialize specialized renderers with safety checks
        this.branchRenderer = typeof BranchRenderer !== 'undefined' ? new BranchRenderer(panelController) : null;
        this.commitRenderer = typeof CommitRenderer !== 'undefined' ? new CommitRenderer(panelController) : null;
        this.fileChangesRenderer = typeof FileChangesRenderer !== 'undefined' ? new FileChangesRenderer(panelController) : null;
        this.filterRenderer = typeof FilterRenderer !== 'undefined' ? new FilterRenderer(panelController) : null;
        this.iconRenderer = typeof IconRenderer !== 'undefined' ? new IconRenderer(panelController) : null;
        
        console.log('Initialized renderers:', {
            branchRenderer: !!this.branchRenderer,
            commitRenderer: !!this.commitRenderer,
            fileChangesRenderer: !!this.fileChangesRenderer,
            filterRenderer: !!this.filterRenderer,
            iconRenderer: !!this.iconRenderer
        });
        
        // If any renderer failed to load, initialize them later
        if (!this.branchRenderer || !this.commitRenderer || !this.fileChangesRenderer || !this.filterRenderer || !this.iconRenderer) {
            console.log('Some renderers not available, scheduling delayed initialization...');
            setTimeout(() => this.initializeRenderers(), 10);
        }
    }
    
    initializeRenderers() {
        console.log('initializeRenderers called, checking renderer availability...');
        console.log('BranchRenderer available:', typeof BranchRenderer !== 'undefined');
        console.log('CommitRenderer available:', typeof CommitRenderer !== 'undefined');
        console.log('FileChangesRenderer available:', typeof FileChangesRenderer !== 'undefined');
        console.log('FilterRenderer available:', typeof FilterRenderer !== 'undefined');
        console.log('IconRenderer available:', typeof IconRenderer !== 'undefined');
        
        if (!this.branchRenderer && typeof BranchRenderer !== 'undefined') {
            console.log('Initializing BranchRenderer...');
            this.branchRenderer = new BranchRenderer(this.panel);
        }
        if (!this.commitRenderer && typeof CommitRenderer !== 'undefined') {
            console.log('Initializing CommitRenderer...');
            this.commitRenderer = new CommitRenderer(this.panel);
        }
        if (!this.fileChangesRenderer && typeof FileChangesRenderer !== 'undefined') {
            console.log('Initializing FileChangesRenderer...');
            this.fileChangesRenderer = new FileChangesRenderer(this.panel);
        }
        if (!this.filterRenderer && typeof FilterRenderer !== 'undefined') {
            console.log('Initializing FilterRenderer...');
            this.filterRenderer = new FilterRenderer(this.panel);
        }
        if (!this.iconRenderer && typeof IconRenderer !== 'undefined') {
            console.log('Initializing IconRenderer...');
            this.iconRenderer = new IconRenderer(this.panel);
        }
        
        console.log('After initialization:', {
            branchRenderer: !!this.branchRenderer,
            commitRenderer: !!this.commitRenderer,
            fileChangesRenderer: !!this.fileChangesRenderer,
            filterRenderer: !!this.filterRenderer,
            iconRenderer: !!this.iconRenderer
        });
    }

    updateContent(branches, commits, error, hasUncommittedChanges = false) {
        // Update branches content
        const branchesContent = document.getElementById('branchesContent');
        if (branchesContent) {
            if (error) {
                branchesContent.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${error}</p></div>`;
            } else if (branches && branches.length > 0) {
                branchesContent.innerHTML = this.generateBranchesHtml(branches, this.panel.currentBranch, this.panel.searchTerm);
            } else {
                branchesContent.innerHTML = '<div class="loading">Loading branches...</div>';
            }
        }
        
        // Update commits content
        const commitsContent = document.getElementById('commitsContent');
        if (commitsContent) {
            if (error) {
                commitsContent.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${error}</p></div>`;
            } else if (commits && commits.length > 0) {
                this.panel.commits = commits;
                this.populateUserFilter(commits);
                this.populateCommitsCompareFilter();
                commitsContent.innerHTML = this.generateCommitsHtml(commits, this.panel.commitsSearchTerm, this.panel.selectedUser);
                // Restore commit selection after content update
                setTimeout(() => this.panel.updateCommitSelection(), 10);
            } else {
                commitsContent.innerHTML = '<div class="loading">Loading commits...</div>';
            }
        }
    }

    // Delegate methods to specialized renderers
    generateBranchesHtml(branches, selectedBranch, searchTerm = '') {
        console.log('UIRenderer.generateBranchesHtml called:', { branches: branches?.length, selectedBranch, searchTerm });
        if (!this.branchRenderer) {
            console.log('BranchRenderer not initialized, attempting to initialize...');
            this.initializeRenderers();
            if (!this.branchRenderer) {
                console.log('BranchRenderer still not available, using fallback implementation');
                return this.generateBranchesHtmlFallback(branches, selectedBranch, searchTerm);
            }
        }
        console.log('BranchRenderer available, calling generateBranchesHtml');
        return this.branchRenderer.generateBranchesHtml(branches, selectedBranch, searchTerm);
    }
    
    generateBranchesHtmlFallback(branches, selectedBranch, searchTerm = '') {
        console.log('Using fallback branch rendering');
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

        // Simple rendering without specialized renderer
        return filteredBranches.map(branch => {
            const isSelected = (selectedBranch && branch.name === selectedBranch);
            const isCurrent = branch.isCurrent;
            const highlightClass = isSelected ? 'selected' : '';
            const currentClass = isCurrent ? 'current' : '';
            const typeIcon = branch.isRemote ? '🌐' : '🌿';
            const refs = branch.ahead || branch.behind ? 
                `+${branch.ahead || 0} -${branch.behind || 0}` : '';

            // For remote branches, show only the branch name without origin
            const displayName = branch.isRemote ? branch.name.split('/').slice(1).join('/') : branch.name;

            return `
                <div class="branch-item ${highlightClass} ${currentClass}" 
                     onclick="selectBranch('${branch.name}')" 
                     oncontextmenu="event.preventDefault(); showBranchContextMenu(event, '${branch.name}')">
                    <div class="branch-icon">${typeIcon}</div>
                    <div class="branch-name">${displayName}</div>
                    <div class="branch-refs">${refs}</div>
                </div>
            `;
        }).join('');
    }

    generateBranchItemsHtml(branches, selectedBranch) {
        if (!this.branchRenderer) {
            this.initializeRenderers();
            if (!this.branchRenderer) return '';
        }
        return this.branchRenderer.generateBranchItemsHtml(branches, selectedBranch);
    }

    generateCommitsHtml(commits, searchTerm = '', selectedUser = 'all') {
        if (!this.commitRenderer) {
            this.initializeRenderers();
            if (!this.commitRenderer) return '<div class="empty-state"><h3>Loading...</h3></div>';
        }
        return this.commitRenderer.generateCommitsHtml(commits, searchTerm, selectedUser);
    }

    generateFileChangesLayout(commit, files) {
        console.log('UIRenderer.generateFileChangesLayout called:', { commit: commit?.hash, files: files?.length });
        if (!this.fileChangesRenderer) {
            console.log('FileChangesRenderer not initialized, attempting to initialize...');
            this.initializeRenderers();
            if (!this.fileChangesRenderer) {
                console.log('FileChangesRenderer still not available, using fallback implementation');
                return this.generateFileChangesLayoutFallback(commit, files);
            }
        }
        console.log('FileChangesRenderer available, calling generateFileChangesLayout');
        return this.fileChangesRenderer.generateFileChangesLayout(commit, files);
    }
    
    generateFileChangesLayoutFallback(commit, files) {
        console.log('Using fallback file changes rendering');
        const fileTreeHtml = files && files.length > 0 
            ? this.generateFileTreeHtmlFallback(files, commit)
            : '<div class="empty-state"><h3>No selection</h3><p>Select a commit to view file changes, or <a href="#" onclick="showWorkingDirectoryChanges()">view working directory changes</a></p></div>';
        
        const commitDetailsHtml = this.generateCommitDetailsHtmlFallback(commit);
        const compareHeaderHtml = this.generateCompareHeaderHtmlFallback();

        return `
            <div class="file-changes-container">
                ${compareHeaderHtml}
                <div class="file-changes-tree">
                    ${fileTreeHtml}
                </div>
                <div class="commit-details">
                    ${commitDetailsHtml}
                </div>
            </div>
        `;
    }
    
    generateFileTreeHtmlFallback(files, commit) {
        if (!files || files.length === 0) {
            return '<div class="empty-state"><h3>No files changed</h3></div>';
        }

        return files.map(file => {
            const statusClass = this.getStatusClassFallback(file.status);
            const changesText = this.getFileChangeStatsFallback(file);
            
            return `
                <div class="file-tree-item file ${statusClass}" 
                     data-file-path="${file.file}"
                     onclick="selectFile('${file.file}', '${commit?.hash || 'uncommitted'}')" 
                     oncontextmenu="event.preventDefault(); selectFileOnly('${file.file}'); showFileContextMenu(event, '${file.file}', '${commit?.hash || 'uncommitted'}')">
                    <div class="file-tree-icon">📄</div>
                    <div class="file-tree-name">
                        ${this.escapeHtmlFallback(file.file)}${changesText ? `<span class="file-changes"> ${changesText}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    generateCommitDetailsHtmlFallback(commit) {
        if (!commit) return '';
        
        return `
            <div class="commit-details-header">
                <h3>Commit Details</h3>
            </div>
            <div class="commit-details-content">
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Hash:</span>
                    <span class="commit-detail-value">${commit.hash}</span>
                </div>
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Author:</span>
                    <span class="commit-detail-value">${this.escapeHtmlFallback(commit.author)}</span>
                </div>
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Date:</span>
                    <span class="commit-detail-value">${this.formatDateFallback(commit.date)}</span>
                </div>
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Message:</span>
                    <span class="commit-detail-value">${this.escapeHtmlFallback(commit.message)}</span>
                </div>
            </div>
        `;
    }
    
    generateCompareHeaderHtmlFallback() {
        const selectedCommits = Array.from(this.panel.selectedCommits);
        const isMultipleCommits = selectedCommits.length > 1;
        
        return `
            <div class="compare-header">
                <div class="compare-header-content">
                    <span class="compare-label">Compare Against:</span>
                    <select class="compare-select" onchange="changeCompareOption(this.value)">
                        <option value="previous" ${this.panel.compareAgainst === 'previous' ? 'selected' : ''}>Previous Commit</option>
                        <option value="branch" ${this.panel.compareAgainst === 'branch' ? 'selected' : ''}>Branch</option>
                        <option value="working" ${this.panel.compareAgainst === 'working' ? 'selected' : ''}>Working Directory</option>
                    </select>
                    ${this.panel.compareAgainst === 'branch' ? `
                        <select class="branch-select" onchange="changeCompareBranch(this.value)">
                            <option value="">Select branch...</option>
                            ${this.panel.branches ? this.panel.branches.map(branch => 
                                `<option value="${branch.name}" ${branch.name === this.panel.selectedCompareBranch ? 'selected' : ''}>${branch.name}</option>`
                            ).join('') : ''}
                        </select>
                    ` : ''}
                </div>
                <div class="compare-info">
                    ${isMultipleCommits ? 'Multiple commits selected' : selectedCommits.length === 1 ? 'Single commit selected' : 'No commits selected'}
                </div>
            </div>
        `;
    }
    
    getStatusClassFallback(status) {
        switch (status) {
            case 'A': return 'added';
            case 'D': return 'deleted';
            case 'M': return 'modified';
            case 'R': return 'renamed';
            default: return 'modified';
        }
    }
    
    getFileChangeStatsFallback(file) {
        if (file.additions > 0 && file.deletions > 0) {
            return `+${file.additions}, -${file.deletions}`;
        } else if (file.additions > 0) {
            return `+${file.additions}`;
        } else if (file.deletions > 0) {
            return `-${file.deletions}`;
        }
        return '';
    }
    
    formatDateFallback(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtmlFallback(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateFileTreeHtml(files, commit, comparison = null) {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return '<div class="empty-state"><h3>Loading...</h3></div>';
        }
        return this.fileChangesRenderer.generateFileTreeHtml(files, commit, comparison);
    }

    buildFileTree(files) {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return {};
        }
        return this.fileChangesRenderer.buildFileTree(files);
    }

    renderTreeNodes(nodes, commitHash, prefix = '') {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return '';
        }
        return this.fileChangesRenderer.renderTreeNodes(nodes, commitHash, prefix);
    }

    generateCompareHeaderHtml() {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return '';
        }
        return this.fileChangesRenderer.generateCompareHeaderHtml();
    }

    generateCommitDetailsHtml(commit) {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return '';
        }
        return this.fileChangesRenderer.generateCommitDetailsHtml(commit);
    }

    populateUserFilter(commits) {
        if (!this.filterRenderer) {
            this.initializeRenderers();
            if (!this.filterRenderer) return;
        }
        return this.filterRenderer.populateUserFilter(commits);
    }

    populateCommitsCompareFilter() {
        if (!this.filterRenderer) {
            this.initializeRenderers();
            if (!this.filterRenderer) return;
        }
        return this.filterRenderer.populateCommitsCompareFilter();
    }

    getStatusIcon(status) {
        if (!this.iconRenderer) {
            this.initializeRenderers();
            if (!this.iconRenderer) return '📄';
        }
        return this.iconRenderer.getStatusIcon(status);
    }

    getFileTypeIcon(fileName) {
        if (!this.iconRenderer) {
            this.initializeRenderers();
            if (!this.iconRenderer) return '📄';
        }
        return this.iconRenderer.getFileTypeIcon(fileName);
    }

    getStatusClass(status) {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return 'modified';
        }
        return this.fileChangesRenderer.getStatusClass(status);
    }

    getFileChangeStats(file) {
        if (!this.fileChangesRenderer) {
            this.initializeRenderers();
            if (!this.fileChangesRenderer) return '';
        }
        return this.fileChangesRenderer.getFileChangeStats(file);
    }

    formatDate(date) {
        if (!this.commitRenderer) {
            this.initializeRenderers();
            if (!this.commitRenderer) return '';
        }
        return this.commitRenderer.formatDate(date);
    }

    escapeHtml(text) {
        if (!this.commitRenderer) {
            this.initializeRenderers();
            if (!this.commitRenderer) return text || '';
        }
        return this.commitRenderer.escapeHtml(text);
    }
}
