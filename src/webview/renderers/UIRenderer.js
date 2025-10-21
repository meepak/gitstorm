// UI Renderer - Main orchestrator for all HTML generation and UI updates
class UIRenderer {
    constructor(panelController) {
        this.panel = panelController;
        
        // Initialize specialized renderers
        this.branchRenderer = new BranchRenderer(panelController);
        this.commitRenderer = new CommitRenderer(panelController);
        this.fileChangesRenderer = new FileChangesRenderer(panelController);
        this.filterRenderer = new FilterRenderer(panelController);
        this.iconRenderer = new IconRenderer(panelController);
    }

    updateContent(branches, commits, stashes, error, hasUncommittedChanges = false, hasStagedChanges = false) {
        // Store current filter values before updating
        const currentUserFilter = this.panel.selectedUser;
        const currentCommitsCompare = this.panel.commitsCompareAgainst;
        const currentFilesCompare = this.panel.compareAgainst;
        
        // Update branches content
        const branchesContent = document.getElementById('branchesContent');
        if (branchesContent) {
            if (error) {
                branchesContent.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${error}</p></div>`;
            } else if (branches && branches.length > 0) {
                branchesContent.innerHTML = this.generateBranchesHtml(branches, stashes, this.panel.currentBranch, this.panel.searchTerm);
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
                commitsContent.innerHTML = this.generateCommitsHtml(commits, this.panel.commitsSearchTerm, this.panel.selectedUser, hasUncommittedChanges, hasStagedChanges);
                // Restore commit selection after content update
                setTimeout(() => this.panel.updateCommitSelection(), 10);
            } else {
                commitsContent.innerHTML = '<div class="loading">Loading commits...</div>';
            }
        }
        
        // Always populate compare filter when branches are available
        if (branches && branches.length > 0) {
            this.panel.branches = branches;
            this.populateCommitsCompareFilter();
            this.filterRenderer.populateFilesCompareFilter();
        }
        
        // Restore filter values after all updates
        setTimeout(() => {
            this.restoreFilterValues(currentUserFilter, currentCommitsCompare, currentFilesCompare);
        }, 50);
    }

    // Delegate methods to specialized renderers
    generateBranchesHtml(branches, stashes, selectedBranch, searchTerm = '') {
        return this.branchRenderer.generateBranchesHtml(branches, stashes, selectedBranch, searchTerm);
    }

    generateBranchItemsHtml(branches, selectedBranch) {
        return this.branchRenderer.generateBranchItemsHtml(branches, selectedBranch);
    }

    generateCommitsHtml(commits, searchTerm = '', selectedUser = 'all', hasUncommittedChanges = false, hasStagedChanges = false) {
        return this.commitRenderer.generateCommitsHtml(commits, searchTerm, selectedUser, hasUncommittedChanges, hasStagedChanges);
    }

    generateFileChangesLayout(commit, files) {
        return this.fileChangesRenderer.generateFileChangesLayout(commit, files);
    }

    generateFileTreeHtml(files, commit, comparison = null) {
        return this.fileChangesRenderer.generateFileTreeHtml(files, commit, comparison);
    }

    buildFileTree(files) {
        return this.fileChangesRenderer.buildFileTree(files);
    }

    renderTreeNodes(nodes, commitHash, prefix = '') {
        return this.fileChangesRenderer.renderTreeNodes(nodes, commitHash, prefix);
    }

    generateCompareHeaderHtml() {
        return this.fileChangesRenderer.generateCompareHeaderHtml();
    }

    generateCommitDetailsHtml(commit) {
        return this.fileChangesRenderer.generateCommitDetailsHtml(commit);
    }

    populateUserFilter(commits) {
        return this.filterRenderer.populateUserFilter(commits);
    }

    populateCommitsCompareFilter() {
        return this.filterRenderer.populateCommitsCompareFilter();
    }

    getStatusIcon(status) {
        return this.iconRenderer.getStatusIcon(status);
    }

    getFileTypeIcon(fileName) {
        return this.iconRenderer.getFileTypeIcon(fileName);
    }

    getStatusClass(status) {
        return this.fileChangesRenderer.getStatusClass(status);
    }

    getFileChangeStats(file) {
        return this.fileChangesRenderer.getFileChangeStats(file);
    }

    formatDate(date) {
        return this.commitRenderer.formatDate(date);
    }

    escapeHtml(text) {
        return this.commitRenderer.escapeHtml(text);
    }

    // Restore filter values after refresh
    restoreFilterValues(userFilter, commitsCompare, filesCompare) {
        // Restore user filter
        const userSelect = document.getElementById('userFilter');
        if (userSelect && userFilter) {
            if (userSelect.querySelector(`option[value="${userFilter}"]`)) {
                userSelect.value = userFilter;
                this.panel.selectedUser = userFilter;
            }
        }
        
        // Restore commits compare filter
        const commitsCompareSelect = document.getElementById('commitsCompareFilter');
        if (commitsCompareSelect && commitsCompare) {
            if (commitsCompareSelect.querySelector(`option[value="${commitsCompare}"]`)) {
                commitsCompareSelect.value = commitsCompare;
                this.panel.commitsCompareAgainst = commitsCompare;
                
                // If commits compare is not 'none', we need to refetch commits with compare
                if (commitsCompare !== 'none') {
                    console.log('Restoring commits compare filter, refetching commits with compare:', commitsCompare);
                    this.panel.messageHandler.sendMessage('getCommitsWithCompare', {
                        branch: this.panel.currentBranch,
                        compareBranch: commitsCompare
                    });
                }
            }
        }
        
        // Restore files compare filter
        const filesCompareSelect = document.getElementById('filesCompareFilter');
        if (filesCompareSelect && filesCompare) {
            if (filesCompareSelect.querySelector(`option[value="${filesCompare}"]`)) {
                filesCompareSelect.value = filesCompare;
                this.panel.compareAgainst = filesCompare;
            }
        }
        
        console.log('Filter values restored:', { userFilter, commitsCompare, filesCompare });
    }
}