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
                // Cache the search term
                this.panel.cacheManager.cacheUIState();
                this.debounce(() => this.filterBranches(), 300);
            });
        }

        // Commits search
        const commitsSearchInput = document.getElementById('commitsSearch');
        if (commitsSearchInput) {
            commitsSearchInput.addEventListener('input', (e) => {
                this.panel.commitsSearchTerm = e.target.value;
                // Cache the search term
                this.panel.cacheManager.cacheUIState();
                this.debounce(() => this.filterCommits(), 300);
            });
        }

        // User filter
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.panel.selectedUser = e.target.value;
                // Cache the user filter selection
                this.panel.cacheManager.cacheUIState();
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

        // Files search
        const filesSearchInput = document.getElementById('filesSearch');
        console.log('Setting up files search input:', !!filesSearchInput);
        if (filesSearchInput) {
            filesSearchInput.addEventListener('input', (e) => {
                console.log('Files search input changed:', e.target.value);
                this.panel.filesSearchTerm = e.target.value;
                // Cache the search term
                this.panel.cacheManager.cacheUIState();
                this.debounce(() => this.filterFiles(), 300);
            });
        } else {
            console.error('Files search input not found!');
        }

        // Files compare filter
        const filesCompareFilter = document.getElementById('filesCompareFilter');
        if (filesCompareFilter) {
            filesCompareFilter.addEventListener('change', (e) => {
                this.handleFilesCompareChange(e.target.value);
            });
        }
    }

    filterBranches() {
        console.log('Filtering branches with search term:', this.panel.searchTerm);
        const branchesContent = document.getElementById('branchesContent');
        if (branchesContent && this.panel.branches) {
            const newHtml = this.panel.uiRenderer.generateBranchesHtml(this.panel.branches, this.panel.stashes, this.panel.currentBranch, this.panel.searchTerm);
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
            // Apply filters to the current commits
            const filteredCommits = this.filterCommitsByCriteria(this.panel.commits, this.panel.commitsSearchTerm, this.panel.selectedUser);
            const newHtml = this.panel.uiRenderer.generateCommitsHtml(filteredCommits, this.panel.commitsSearchTerm, this.panel.selectedUser);
            commitsContent.innerHTML = newHtml;
            // Restore commit selection after content update
            setTimeout(() => this.panel.updateCommitSelection(), 10);
            console.log('Updated commits content with', filteredCommits.length, 'filtered commits');
        } else {
            console.log('commitsContent element not found');
        }
    }

    filterFiles() {
        console.log('Filtering files with search term:', this.panel.filesSearchTerm);
        console.log('Current files available:', this.panel.currentFiles?.length || 0);
        const filesContent = document.getElementById('filesContent');
        console.log('filesContent element found:', !!filesContent);
        if (filesContent && this.panel.currentFiles) {
            // Filter files based on search term
            const filteredFiles = this.filterFilesByCriteria(this.panel.currentFiles, this.panel.filesSearchTerm);
            console.log('Filtered files result:', filteredFiles.length, 'files');
            
            // If searching and no results, show search-specific message
            if (this.panel.filesSearchTerm && this.panel.filesSearchTerm.length > 0 && filteredFiles.length === 0) {
                const searchMessageHtml = `
                    <div class="file-changes-container">
                        <div class="file-changes-tree">
                            <div class="empty-state"><h3>No such file in change list</h3></div>
                        </div>
                    </div>
                `;
                filesContent.innerHTML = searchMessageHtml;
                
                // Update the footer separately
                const filesFooter = document.getElementById('filesFooter');
                if (filesFooter) {
                    // Hide footer for uncommitted changes, show for others
                    if (this.panel.selectedCommit && (this.panel.selectedCommit.hash === 'WORKING_DIRECTORY' || this.panel.selectedCommit.hash === 'uncommitted')) {
                        filesFooter.style.display = 'none';
                    } else {
                        filesFooter.style.display = 'block';
                        filesFooter.innerHTML = this.panel.uiRenderer.generateCommitDetailsHtml(this.panel.selectedCommit);
                    }
                }
            } else {
                const newHtml = this.panel.uiRenderer.generateFileChangesLayout(this.panel.selectedCommit, filteredFiles);
                filesContent.innerHTML = newHtml;
                
                // Update the footer separately
                const filesFooter = document.getElementById('filesFooter');
                if (filesFooter) {
                    // Hide footer for uncommitted changes, show for others
                    if (this.panel.selectedCommit && (this.panel.selectedCommit.hash === 'WORKING_DIRECTORY' || this.panel.selectedCommit.hash === 'uncommitted')) {
                        filesFooter.style.display = 'none';
                    } else {
                        filesFooter.style.display = 'block';
                        filesFooter.innerHTML = this.panel.uiRenderer.generateCommitDetailsHtml(this.panel.selectedCommit);
                    }
                }
            }
            console.log('Updated files content with', filteredFiles.length, 'filtered files');
        } else {
            console.log('filesContent element not found or no current files');
        }
    }
    
    filterCommitsByCriteria(commits, searchTerm, selectedUser) {
        if (!commits) return [];
        
        let filtered = commits;
        
        // Filter by search term
        if (searchTerm && searchTerm.length > 0) {
            filtered = filtered.filter(commit => 
                commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                commit.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                commit.hash.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter by author
        if (selectedUser && selectedUser !== 'all') {
            filtered = filtered.filter(commit => commit.author === selectedUser);
        }
        
        return filtered;
    }

    filterFilesByCriteria(files, searchTerm) {
        if (!files || !searchTerm || searchTerm.length === 0) {
            return files || [];
        }
        
        const searchLower = searchTerm.toLowerCase();
        const filteredFiles = [];
        const matchedPaths = new Set();
        
        // First pass: find all files that match the search term
        files.forEach(file => {
            const filePath = file.file.toLowerCase();
            if (filePath.includes(searchLower)) {
                filteredFiles.push(file);
                matchedPaths.add(file.file);
            }
        });
        
        // Second pass: add all files that are in parent directories of matched files
        files.forEach(file => {
            const filePath = file.file;
            const pathParts = filePath.split('/');
            
            // Check if this file is a parent directory of any matched file
            for (let i = 1; i <= pathParts.length; i++) {
                const currentPath = pathParts.slice(0, i).join('/');
                if (matchedPaths.has(currentPath)) {
                    // This file is either a match or a parent of a match
                    if (!filteredFiles.some(f => f.file === filePath)) {
                        filteredFiles.push(file);
                    }
                    break;
                }
            }
        });
        
        // Remove duplicates and sort
        const uniqueFiles = filteredFiles.filter((file, index, self) => 
            index === self.findIndex(f => f.file === file.file)
        );
        
        return uniqueFiles.sort((a, b) => a.file.localeCompare(b.file));
    }

    handleCommitsCompareChange(branchName) {
        console.log('Commits compare changed to:', branchName);
        console.log('Current branch:', this.panel.currentBranch);
        
        // Store the selection
        this.panel.commitsCompareAgainst = branchName;
        // Cache the commits compare setting
        this.panel.cacheManager.cacheCompareSettings();
        
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
                
                // Clear current commits display while loading
                const commitsContent = document.getElementById('commitsContent');
                if (commitsContent) {
                    commitsContent.innerHTML = '<div class="loading">Loading compared commits...</div>';
                }
                
                this.panel.messageHandler.sendMessage('getCommitsWithCompare', {
                    branch: this.panel.currentBranch,
                    compareBranch: branchName
                });
            } else {
                console.log('No current branch selected for compare');
                const commitsContent = document.getElementById('commitsContent');
                if (commitsContent) {
                    commitsContent.innerHTML = '<div class="empty-state"><h3>No branch selected</h3><p>Please select a branch first</p></div>';
                }
            }
        }
    }

    handleFilesCompareChange(value) {
        console.log('Files compare changed to:', value);
        this.panel.changeCompareOptionSingle(value);
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
        this.panel.filesSearchTerm = '';
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
        
        const filesSearchInput = document.getElementById('filesSearch');
        if (filesSearchInput) {
            filesSearchInput.value = '';
        }
        
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.value = 'all';
        }
        
        // Refresh content
        this.filterBranches();
        this.filterCommits();
        this.filterFiles();
    }


    // Get current search state
    getSearchState() {
        return {
            branchesSearchTerm: this.panel.searchTerm,
            commitsSearchTerm: this.panel.commitsSearchTerm,
            filesSearchTerm: this.panel.filesSearchTerm,
            selectedUser: this.panel.selectedUser,
            compareAgainst: this.panel.commitsCompareAgainst
        };
    }

    // Restore search state
    restoreSearchState(state) {
        if (state) {
            this.panel.searchTerm = state.branchesSearchTerm || '';
            this.panel.commitsSearchTerm = state.commitsSearchTerm || '';
            this.panel.filesSearchTerm = state.filesSearchTerm || '';
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
            
            const filesSearchInput = document.getElementById('filesSearch');
            if (filesSearchInput) {
                filesSearchInput.value = this.panel.filesSearchTerm;
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
