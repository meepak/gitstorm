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

    updateContent(branches, commits, error, hasUncommittedChanges = false) {
        // Update branches content
        const branchesContent = document.getElementById('branchesContent');
        if (branchesContent) {
            if (error) {
                branchesContent.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${error}</p></div>`;
            } else if (branches && branches.length > 0) {
                branchesContent.innerHTML = this.branchRenderer.generateBranchesHtml(branches, this.panel.currentBranch, this.panel.searchTerm);
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
                this.filterRenderer.populateUserFilter(commits);
                this.filterRenderer.populateCommitsCompareFilter();
                commitsContent.innerHTML = this.commitRenderer.generateCommitsHtml(commits, this.panel.commitsSearchTerm, this.panel.selectedUser);
                // Restore commit selection after content update
                setTimeout(() => this.panel.updateCommitSelection(), 10);
            } else {
                commitsContent.innerHTML = '<div class="loading">Loading commits...</div>';
            }
        }
    }

    // Delegate methods to specialized renderers
    generateBranchesHtml(branches, selectedBranch, searchTerm = '') {
        return this.branchRenderer.generateBranchesHtml(branches, selectedBranch, searchTerm);
    }

    generateBranchItemsHtml(branches, selectedBranch) {
        return this.branchRenderer.generateBranchItemsHtml(branches, selectedBranch);
    }

    generateCommitsHtml(commits, searchTerm = '', selectedUser = 'all') {
        return this.commitRenderer.generateCommitsHtml(commits, searchTerm, selectedUser);
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
}
