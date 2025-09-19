// Search Manager - Handles all search and filtering functionality
class SearchManager {
    constructor(panelController) {
        this.panel = panelController;
        // Don't setup event listeners here - wait for DOM to be ready
        // Event listeners will be set up in PanelController.initialize()
    }

    setupSearchEventListeners() {
        // Branches search
        const branchesSearchInput = document.getElementById('branchesSearch');
        if (branchesSearchInput) {
            branchesSearchInput.addEventListener('input', (e) => {
                this.panel.searchTerm = e.target.value;
                this.debounce(() => this.filterBranches(), 300);
            });
        }

        // Commits search
        const commitsSearchInput = document.getElementById('commitsSearch');
        if (commitsSearchInput) {
            commitsSearchInput.addEventListener('input', (e) => {
                this.panel.commitsSearchTerm = e.target.value;
                this.debounce(() => this.filterCommits(), 300);
            });
        }

        // User filter
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.panel.selectedUser = e.target.value;
                this.filterCommits();
            });
        }

        // Commits compare filter
        const commitsCompareFilter = document.getElementById('commitsCompareFilter');
        if (commitsCompareFilter) {
            commitsCompareFilter.addEventListener('change', (e) => {
                this.handleCommitsCompareChange(e.target.value);
            });
        }
    }

    filterBranches() {
        console.log('Filtering branches with search term:', this.panel.searchTerm);
        const branchesContent = document.getElementById('branchesContent');
        if (branchesContent && this.panel.branches) {
            const newHtml = this.panel.uiRenderer.generateBranchesHtml(this.panel.branches, this.panel.currentBranch, this.panel.searchTerm);
            branchesContent.innerHTML = newHtml;
            
            // If we're searching, auto-expand all sections to show results
            if (this.panel.searchTerm.length > 0) {
                this.expandAllSections();
            }
            
            console.log('Updated branches content');
        } else {
            console.log('branchesContent element not found');
        }
    }

    filterCommits() {
        if (this.panel.commits.length === 0) {
            console.log('No commits available for filtering');
            return;
        }
        
        console.log('Filtering commits with search term:', this.panel.commitsSearchTerm, 'and user:', this.panel.selectedUser);
        const commitsContent = document.getElementById('commitsContent');
        if (commitsContent) {
            const newHtml = this.panel.uiRenderer.generateCommitsHtml(this.panel.commits, this.panel.commitsSearchTerm, this.panel.selectedUser);
            commitsContent.innerHTML = newHtml;
            // Restore commit selection after content update
            setTimeout(() => this.panel.updateCommitSelection(), 10);
            console.log('Updated commits content');
        } else {
            console.log('commitsContent element not found');
        }
    }

    handleCommitsCompareChange(branchName) {
        console.log('Commits compare changed to:', branchName);
        console.log('Current branch:', this.panel.currentBranch);
        
        // Store the selection
        localStorage.setItem('gitstorm-commits-compare-against', branchName);
        this.panel.commitsCompareAgainst = branchName;
        
        // Update the compare select element
        const compareSelect = document.getElementById('commitsCompareFilter');
        if (compareSelect) {
            compareSelect.value = branchName || 'none';
        }
        
        // Keep the current branch highlighted, not the target branch
        this.panel.updateBranchHighlighting(this.panel.currentBranch);
        
        if (branchName === 'none') {
            // If no compare option selected, refresh current commits
            console.log('Refreshing data (no compare)');
            this.panel.refreshData();
        } else {
            // Request commits with compare from backend
            if (this.panel.currentBranch) {
                console.log('Sending getCommitsWithCompare message:', {
                    branch: this.panel.currentBranch,
                    compareBranch: branchName
                });
                this.panel.messageHandler.sendMessage('getCommitsWithCompare', {
                    branch: this.panel.currentBranch,
                    compareBranch: branchName
                });
            } else {
                console.log('No current branch selected for compare');
            }
        }
    }

    expandAllSections() {
        // Expand all collapsible sections when searching
        const sections = document.querySelectorAll('.tree-section-content');
        sections.forEach(section => {
            section.style.display = 'block';
        });
    }

    debounce(func, wait) {
        // Clear existing timeout
        if (this.panel.searchTimeout) {
            clearTimeout(this.panel.searchTimeout);
        }
        
        // Set new timeout
        this.panel.searchTimeout = setTimeout(func, wait);
    }

    // Clear all search filters
    clearAllFilters() {
        this.panel.searchTerm = '';
        this.panel.commitsSearchTerm = '';
        this.panel.selectedUser = 'all';
        
        // Update UI elements
        const branchesSearchInput = document.getElementById('branchesSearch');
        if (branchesSearchInput) {
            branchesSearchInput.value = '';
        }
        
        const commitsSearchInput = document.getElementById('commitsSearch');
        if (commitsSearchInput) {
            commitsSearchInput.value = '';
        }
        
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.value = 'all';
        }
        
        // Refresh content
        this.filterBranches();
        this.filterCommits();
    }

    // Get current search state
    getSearchState() {
        return {
            branchesSearchTerm: this.panel.searchTerm,
            commitsSearchTerm: this.panel.commitsSearchTerm,
            selectedUser: this.panel.selectedUser,
            compareAgainst: this.panel.commitsCompareAgainst
        };
    }

    // Restore search state
    restoreSearchState(state) {
        if (state) {
            this.panel.searchTerm = state.branchesSearchTerm || '';
            this.panel.commitsSearchTerm = state.commitsSearchTerm || '';
            this.panel.selectedUser = state.selectedUser || 'all';
            this.panel.commitsCompareAgainst = state.compareAgainst || 'none';
            
            // Update UI elements
            const branchesSearchInput = document.getElementById('branchesSearch');
            if (branchesSearchInput) {
                branchesSearchInput.value = this.panel.searchTerm;
            }
            
            const commitsSearchInput = document.getElementById('commitsSearch');
            if (commitsSearchInput) {
                commitsSearchInput.value = this.panel.commitsSearchTerm;
            }
            
            const userFilter = document.getElementById('userFilter');
            if (userFilter) {
                userFilter.value = this.panel.selectedUser;
            }
            
            const commitsCompareFilter = document.getElementById('commitsCompareFilter');
            if (commitsCompareFilter) {
                commitsCompareFilter.value = this.panel.commitsCompareAgainst;
            }
        }
    }
}
