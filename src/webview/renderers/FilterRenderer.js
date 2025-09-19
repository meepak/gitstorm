// Filter Renderer - Handles filter dropdowns and UI population
class FilterRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    populateUserFilter(commits) {
        const userSelect = document.getElementById('userFilter');
        if (!userSelect || !commits) return;

        // Store current selection
        const currentSelection = userSelect.value;
        
        // Clear existing options
        userSelect.innerHTML = '<option value="all">All Authors</option>';
        
        // Get unique authors
        const authors = [...new Set(commits.map(commit => commit.author))].sort();
        
        // Add author options
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            userSelect.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentSelection && userSelect.querySelector(`option[value="${currentSelection}"]`)) {
            userSelect.value = currentSelection;
        }
    }

    populateCommitsCompareFilter() {
        const compareSelect = document.getElementById('commitsCompareFilter');
        if (!compareSelect || !this.panel.branches) return;

        // Store current selection
        const currentSelection = compareSelect.value;
        
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
        
        // Add branch options (only local branches)
        this.panel.branches.forEach(branch => {
            if (!branch.isRemote) {
                const option = document.createElement('option');
                option.value = branch.name;
                option.textContent = branch.name;
                compareSelect.appendChild(option);
            }
        });
        
        // Restore selection if it still exists
        if (currentSelection && compareSelect.querySelector(`option[value="${currentSelection}"]`)) {
            compareSelect.value = currentSelection;
        } else {
            // Default to "Show all commits"
            compareSelect.value = this.panel.commitsCompareAgainst || 'none';
        }
    }
}
