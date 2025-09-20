// Filter Renderer - Handles filter dropdowns and UI population
class FilterRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    populateUserFilter(commits) {
        const userSelect = document.getElementById('userFilter');
        if (!userSelect) return;

        // Store current selection from panel state (more reliable than DOM)
        const currentSelection = this.panel.selectedUser || userSelect.value;
        
        // Clear existing options
        userSelect.innerHTML = '<option value="all">All Authors</option>';
        
        // Try to get authors from cache first, fallback to commits
        let authors = [];
        if (this.panel.cacheManager && this.panel.cacheManager.isDropdownCacheValid()) {
            authors = this.panel.cacheManager.getCachedAuthors();
        } else if (commits && commits.length > 0) {
            authors = [...new Set(commits.map(commit => commit.author))].sort();
        }
        
        // Add author options
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            userSelect.appendChild(option);
        });
        
        // Restore selection from panel state
        if (currentSelection && userSelect.querySelector(`option[value="${currentSelection}"]`)) {
            userSelect.value = currentSelection;
        } else {
            // Fallback to 'all' if selection not found
            userSelect.value = 'all';
            this.panel.selectedUser = 'all';
        }
    }

    populateCommitsCompareFilter() {
        const compareSelect = document.getElementById('commitsCompareFilter');
        if (!compareSelect) return;

        // Store current selection from panel state (more reliable than DOM)
        const currentSelection = this.panel.commitsCompareAgainst || compareSelect.value;
        
        // Clear existing options
        compareSelect.innerHTML = '';
        
        // Add "Show all commits" as first option
        const showAllOption = document.createElement('option');
        showAllOption.value = 'none';
        showAllOption.textContent = 'Show all commits';
        compareSelect.appendChild(showAllOption);
        
        // Add unselectable label "Select branch to compare"
        const labelOption = document.createElement('option');
        labelOption.value = '';
        labelOption.textContent = 'Select branch to compare';
        labelOption.disabled = true;
        labelOption.style.fontStyle = 'italic';
        labelOption.style.color = '#666';
        compareSelect.appendChild(labelOption);
        
        // Try to get branches from cache first, fallback to panel.branches
        let branches = [];
        if (this.panel.cacheManager && this.panel.cacheManager.isDropdownCacheValid()) {
            const cachedBranches = this.panel.cacheManager.getCachedCompareBranches();
            cachedBranches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch.name;
                option.textContent = branch.displayName;
                compareSelect.appendChild(option);
            });
        } else if (this.panel.branches && this.panel.branches.length > 0) {
            // Fallback to panel.branches
            this.panel.branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch.name;
                // For remote branches, show only the branch name without origin
                const displayName = branch.isRemote ? branch.name.split('/').slice(1).join('/') : branch.name;
                option.textContent = displayName;
                compareSelect.appendChild(option);
            });
        }
        
        // Restore selection from panel state
        if (currentSelection && compareSelect.querySelector(`option[value="${currentSelection}"]`)) {
            compareSelect.value = currentSelection;
        } else {
            // Fallback to 'none' if selection not found
            compareSelect.value = 'none';
            this.panel.commitsCompareAgainst = 'none';
        }
        
        console.log('Populated compare filter with selection:', compareSelect.value);
    }

    populateFilesCompareFilter() {
        const filesCompareFilter = document.getElementById('filesCompareFilter');
        if (!filesCompareFilter) return;
        
        // Store current selection from panel state (more reliable than DOM)
        const currentSelection = this.panel.compareAgainst || filesCompareFilter.value;
        
        // Clear existing branch options (keep the first 3 default options)
        const defaultOptions = filesCompareFilter.querySelectorAll('option:not([value="working"]):not([value="previous"]):not([disabled])');
        defaultOptions.forEach(option => option.remove());
        
        // Try to get branches from cache first, fallback to panel.branches
        if (this.panel.cacheManager && this.panel.cacheManager.isDropdownCacheValid()) {
            const cachedBranches = this.panel.cacheManager.getCachedCompareBranches();
            cachedBranches.forEach(branch => {
                const option = document.createElement('option');
                option.value = `branch:${branch.name}`;
                option.textContent = branch.name;
                filesCompareFilter.appendChild(option);
            });
        } else if (this.panel.branches && this.panel.branches.length > 0) {
            // Fallback to panel.branches
            this.panel.branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = `branch:${branch.name}`;
                option.textContent = branch.name;
                filesCompareFilter.appendChild(option);
            });
        }
        
        // Restore selection from panel state
        if (currentSelection && filesCompareFilter.querySelector(`option[value="${currentSelection}"]`)) {
            filesCompareFilter.value = currentSelection;
        } else {
            // Fallback to 'working' if selection not found
            filesCompareFilter.value = 'working';
            this.panel.compareAgainst = 'working';
        }
        
        console.log('Populated files compare filter with selection:', filesCompareFilter.value);
    }
}
