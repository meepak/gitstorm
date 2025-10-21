// GitStorm Panel Controller - Core class
class PanelController {
    constructor() {
        this.vscode = window.acquireVsCodeApi();
        this.currentBranch = null;
        this.selectedCommits = new Set();
        this.lastClickedCommit = null;
        this.commits = [];
        this.branches = [];
        this.stashes = [];
        this.selectedStash = null;
        this.searchTerm = '';
        this.commitsSearchTerm = '';
        this.filesSearchTerm = '';
        this.selectedUser = 'all';
        this.currentFiles = [];
        this.selectedCommit = null;
        // Initialize with default values (will be restored from cache later)
        this.panelSizes = { branches: 280, commits: 400, files: 300 };
        this.searchTimeout = null;
        this.commitsSearchTimeout = null;
        this.compareAgainst = 'working';
        this.selectedCompareBranch = null;
        this.fileCompareData = {};
        this.selectedFileId = null;
        this.commitsCompareAgainst = 'none';
        this.hasUncommittedChanges = false;
        this.hasStagedChanges = false;
        this.workspaceRoot = null;
        
        // Initialize cache manager
        console.log('PanelController: About to create CacheManager...', typeof CacheManager);
        if (typeof CacheManager === 'undefined') {
            console.warn('PanelController: CacheManager is not defined! Caching will be disabled.');
            this.cacheManager = null;
        } else {
            this.cacheManager = new CacheManager(this);
            console.log('PanelController: CacheManager created successfully');
        }
        
        // Initialize sub-components (UIRenderer first as others depend on it)
        this.uiRenderer = new UIRenderer(this);
        this.messageHandler = new MessageHandler(this);
        this.contextMenuHandler = new ContextMenuHandler(this);
        this.searchManager = new SearchManager(this);
        this.gitOperations = new GitOperations(this);
        
        // Make gitOperations globally available
        window.gitOperations = this.gitOperations;
        window.panelController = this;
        
        this.initialize();
    }

    initialize() {
        console.log('GitStorm WebView loaded!');
        this.setupEventListeners();
        this.setupResizeHandlers();
        this.setupMutationObserver();
        this.contextMenuHandler.setupContextMenu();
        
        // Compare dropdown state is now initialized from cache in loadDataAsynchronously
        
        // Setup search manager after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.searchManager.setupSearchEventListeners();
        }, 100);
        
        // Setup refresh button
        this.setupRefreshButton();
        
        // Load UI immediately with empty state, then load data asynchronously
        this.loadUIWithEmptyState();
        this.loadDataAsynchronously();
        
        // Send a test message to the extension (for debugging)
        this.vscode.postMessage({ command: 'test', data: 'WebView is ready' });
    }

    setupEventListeners() {
        // Basic event listeners for resize and general UI
        window.addEventListener('resize', () => {
            this.restorePanelSizes();
        });
        
        // Handle visibility changes to refresh data when panel becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('Panel became visible, checking if data needs refresh...');
                if (this.cacheManager) {
                    this.cacheManager.handleVisibilityChange();
                }
            }
        });
        
        // Handle focus events as backup for visibility detection
        window.addEventListener('focus', () => {
            console.log('Window focused, checking if data needs refresh...');
            if (this.cacheManager) {
                this.cacheManager.handleVisibilityChange();
            }
        });
    }

    setupResizeHandlers() {
        // Panel resize functionality
        const resizeBranches = document.getElementById('resizeBranches');
        const resizeCommits = document.getElementById('resizeCommits');
        const resizeFiles = document.getElementById('resizeFiles');
        
        if (resizeBranches) {
            resizeBranches.addEventListener('mousedown', (e) => {
                this.startResize(e, 'branches');
            });
        }
        
        if (resizeCommits) {
            resizeCommits.addEventListener('mousedown', (e) => {
                this.startResize(e, 'commits');
            });
        }
        
        if (resizeFiles) {
            resizeFiles.addEventListener('mousedown', (e) => {
                this.startResize(e, 'files');
            });
        }
    }

    setupMutationObserver() {
        // Observer to restore panel sizes when DOM changes
        const observer = new MutationObserver(() => {
            this.restorePanelSizes();
        });
        
        const targetNode = document.body;
        const config = { childList: true, subtree: true };
        observer.observe(targetNode, config);
    }

    startResize(e, panelType) {
        e.preventDefault();
        const isResizing = true;
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const rect = document.body.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            if (panelType === 'branches') {
                this.panelSizes.branches = Math.max(200, Math.min(500, mouseX));
                this.restorePanelSizes();
            } else if (panelType === 'commits') {
                const commitsWidth = Math.max(300, Math.min(800, mouseX - this.panelSizes.branches));
                this.panelSizes.commits = commitsWidth;
                this.restorePanelSizes();
            } else if (panelType === 'files') {
                const filesWidth = Math.max(200, Math.min(600, mouseX - this.panelSizes.branches - this.panelSizes.commits));
                this.panelSizes.files = filesWidth;
                this.restorePanelSizes();
            }
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            this.savePanelSizes();
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    restorePanelSizes() {
        const branchesPanel = document.getElementById('branchesPanel');
        const commitsPanel = document.getElementById('commitsPanel');
        const filesPanel = document.getElementById('filesPanel');
        
        if (branchesPanel) {
            branchesPanel.style.width = this.panelSizes.branches + 'px';
        }
        
        if (commitsPanel) {
            commitsPanel.style.width = this.panelSizes.commits + 'px';
        }
        
        if (filesPanel) {
            filesPanel.style.width = this.panelSizes.files + 'px';
        }
    }

    savePanelSizes() {
        // Cache panel sizes
        if (this.cacheManager) {
            this.cacheManager.cachePanelSizes();
        }
    }

    // Main update content method - delegates to UI renderer
    updateContent(branches, commits, stashes, error, hasUncommittedChanges = false, hasStagedChanges = false) {
        console.log('Updating content:', { 
            branches: branches?.length, 
            commits: commits?.length,
            stashes: stashes?.length, 
            error, 
            hasUncommittedChanges,
            hasStagedChanges,
            currentBranch: this.currentBranch
        });
        
        // Store branches for search filtering
        if (branches && branches.length > 0) {
            this.branches = branches;
            // Find and log the current branch (the one you're actually on)
            const actualCurrentBranch = branches.find(b => b.isCurrent);
            console.log('Actual current branch (where you are):', actualCurrentBranch);
            console.log('Selected branch (what you\'re viewing):', this.currentBranch);
        }

        // Store stashes
        if (stashes) {
            this.stashes = stashes;
            console.log('Stashes:', stashes);
        }

        // Store uncommitted and staged changes state
        this.hasUncommittedChanges = hasUncommittedChanges;
        this.hasStagedChanges = hasStagedChanges;
        
        // Cache the data for persistence (async, non-blocking)
        if (this.cacheManager) {
            this.cacheManager.cacheData(branches, commits, stashes, hasUncommittedChanges, hasStagedChanges);
            
            // Cache dropdown data for smooth UI (async, non-blocking)
            this.cacheManager.cacheDropdownData(commits, branches);
            
            // Cache UI state (async, non-blocking)
            this.cacheManager.cacheUIState();
            
            // Cache compare settings (async, non-blocking)
            this.cacheManager.cacheCompareSettings();
            
            // Cache panel sizes (async, non-blocking)
            this.cacheManager.cachePanelSizes();
        }
        
        // Delegate to UI renderer
        this.uiRenderer.updateContent(branches, commits, stashes, error, hasUncommittedChanges, hasStagedChanges);
        
        // Ensure compare dropdown state is restored after content update
        setTimeout(() => {
            this.restoreCompareDropdownState();
        }, 100);
    }

    // Public methods that other components can call
    refreshData() {
        // Check if there's a compare option selected for commits
        if (this.commitsCompareAgainst && this.commitsCompareAgainst !== 'none') {
            console.log('Refresh with compare option:', {
                selectedBranch: this.currentBranch,
                compareBranch: this.commitsCompareAgainst,
                willShow: `commits in ${this.currentBranch} but not in ${this.commitsCompareAgainst}`
            });
            // Use compare functionality for refresh
            this.vscode.postMessage({
                command: 'getCommitsWithCompare',
                branch: this.currentBranch,
                compareBranch: this.commitsCompareAgainst
            });
        } else {
            console.log('Refresh without compare option - showing all commits');
            // Regular refresh
            this.vscode.postMessage({ command: 'refresh' });
        }
    }

    isCurrentBranch() {
        if (!this.branches || this.branches.length === 0) return false;
        
        // Find the current branch (the one with isCurrent: true)
        const currentBranch = this.branches.find(branch => branch.isCurrent);
        if (!currentBranch) return false;
        
        // Check if the selected branch is the current branch
        return this.currentBranch === currentBranch.name;
    }

    // Selection methods
    selectBranch(branchName) {
        console.log('selectBranch called with:', branchName);
        this.currentBranch = branchName;
        this.selectedCommits.clear();
        this.lastClickedCommit = null;
        this.selectedStash = null;
        
        // Reset file changes panel when branch changes
        const filesContent = document.getElementById('filesContent');
        if (filesContent) {
            filesContent.innerHTML = '<div class="empty-state"><h3>Select a commit to view changes</h3></div>';
        }
        
        // Clear diff viewer when branch changes
        this.clearDiffViewer();
        
        // Update branch highlighting
        this.updateBranchHighlighting(branchName);
        
        // Clear stash selection
        this.updateStashHighlighting(null);
        
        // Check if there's a compare option selected
        if (this.commitsCompareAgainst && this.commitsCompareAgainst !== 'none') {
            console.log('Branch selection with compare option:', {
                selectedBranch: branchName,
                compareBranch: this.commitsCompareAgainst,
                willShow: `commits in ${branchName} but not in ${this.commitsCompareAgainst}`
            });
            // Use compare functionality
            this.vscode.postMessage({
                command: 'getCommitsWithCompare',
                branch: branchName,
                compareBranch: this.commitsCompareAgainst
            });
        } else {
            console.log('Branch selection without compare option - showing all commits in:', branchName);
            // Regular branch selection
            this.vscode.postMessage({
                command: 'selectBranch',
                branchName: branchName
            });
        }
        
        // Ensure compare dropdown state is properly restored
        this.restoreCompareDropdownState();
    }

    selectStash(stashName) {
        console.log('selectStash called with:', stashName);
        this.selectedStash = stashName;
        this.currentBranch = null;
        this.selectedCommits.clear();
        this.lastClickedCommit = null;
        
        // Clear commits panel with an appropriate message
        const commitsContent = document.getElementById('commitsContent');
        if (commitsContent) {
            commitsContent.innerHTML = `
                <div class="empty-state">
                    <h3>Stash Selected</h3>
                    <p>Viewing stash: ${stashName}</p>
                    <p style="font-size: 11px; color: var(--description-fg); margin-top: 8px;">
                        Stashes don't have commits. The changes panel shows files in this stash.
                    </p>
                </div>
            `;
        }
        
        // Clear diff viewer
        this.clearDiffViewer();
        
        // Update stash highlighting
        this.updateStashHighlighting(stashName);
        
        // Clear branch selection
        this.updateBranchHighlighting(null);
        
        // Request stash details from backend
        this.vscode.postMessage({
            command: 'selectStash',
            stashName: stashName
        });
    }

    updateStashHighlighting(selectedStash) {
        // Update stash highlighting in the branches panel
        const stashItems = document.querySelectorAll('.stash-item');
        stashItems.forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/selectStash\('([^']+)'\)/);
                if (match) {
                    const itemStashName = match[1];
                    if (itemStashName === selectedStash) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                }
            }
        });
    }

    selectCommit(commitHash, isMultiSelect = false, isRangeSelect = false) {
        console.log('selectCommit called with:', commitHash, 'multiSelect:', isMultiSelect, 'rangeSelect:', isRangeSelect);
        
        if (isRangeSelect && this.lastClickedCommit) {
            // Range select mode (Shift+click)
            this.selectCommitRange(this.lastClickedCommit, commitHash);
        } else if (isMultiSelect) {
            // Multi-select mode (Ctrl+click)
            if (this.selectedCommits.has(commitHash)) {
                this.selectedCommits.delete(commitHash);
            } else {
                this.selectedCommits.add(commitHash);
            }
        } else {
            // Single select mode (normal click)
            this.selectedCommits.clear();
            this.selectedCommits.add(commitHash);
        }
        
        // Update last clicked commit for range selection
        this.lastClickedCommit = commitHash;
        
        this.updateCommitSelection();
        
        // Clear diff viewer when commit selection changes
        this.clearDiffViewer();
        
        // Request commit details based on selection
        if (this.selectedCommits.size === 1) {
            const selectedHash = Array.from(this.selectedCommits)[0];
            console.log('Single commit selected, calling showCommitFileChanges for:', selectedHash);
            this.showCommitFileChanges(selectedHash);
        } else if (this.selectedCommits.size > 1) {
            // Show combined file changes for multiple commits
            console.log('Multiple commits selected, calling showMultiCommitFileChanges for:', Array.from(this.selectedCommits));
            this.showMultiCommitFileChanges(Array.from(this.selectedCommits));
        } else {
            // Clear files panel
            console.log('No commits selected, clearing file changes panel');
            this.clearFileChangesPanel();
        }
    }

    selectCommitRange(startCommitHash, endCommitHash) {
        console.log('selectCommitRange called with:', startCommitHash, 'to', endCommitHash);
        
        // Find the indices of the start and end commits in the current commits array
        const startIndex = this.commits.findIndex(commit => commit.hash === startCommitHash);
        const endIndex = this.commits.findIndex(commit => commit.hash === endCommitHash);
        
        if (startIndex === -1 || endIndex === -1) {
            console.warn('Could not find commit indices for range selection');
            return;
        }
        
        // Determine the range (from smaller index to larger index)
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        // Add all commits in the range to selection
        for (let i = minIndex; i <= maxIndex; i++) {
            this.selectedCommits.add(this.commits[i].hash);
        }
        
        console.log('Range selection added commits from index', minIndex, 'to', maxIndex);
    }

    updateCommitSelection() {
        // Update visual selection of commits
        const commitItems = document.querySelectorAll('.commit-item');
        commitItems.forEach(item => {
            const commitHash = item.dataset.commitHash;
            if (commitHash && this.selectedCommits.has(commitHash)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    updateBranchHighlighting(selectedBranch) {
        // Update branch highlighting in the branches panel
        const branchItems = document.querySelectorAll('.branch-item');
        branchItems.forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick) {
                const match = onclick.match(/selectBranch\('([^']+)'\)/);
                if (match) {
                    const itemBranchName = match[1];
                    if (itemBranchName === selectedBranch) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                }
            }
        });
    }

    // File changes methods
    showCommitFileChanges(hash) {
        console.log('Showing file changes for commit:', hash);
        this.selectedCommit = this.commits.find(c => c.hash === hash) || null;
        this.vscode.postMessage({
            command: 'getCommitDetails',
            hash: hash,
            compareAgainst: this.compareAgainst,
            compareBranch: this.selectedCompareBranch
        });
    }

    showMultiCommitFileChanges(hashes) {
        console.log('Showing file changes for multiple commits:', hashes);
        this.currentCommitIndex = 0; // Reset to first commit
        this.vscode.postMessage({
            command: 'getMultiCommitFiles',
            commitHashes: hashes,
            compareAgainst: this.compareAgainst,
            compareBranch: this.selectedCompareBranch
        });
    }


    clearFileChangesPanel() {
        const filesContent = document.getElementById('filesContent');
        const panelContent = filesContent?.parentElement;
        if (filesContent) {
            // Generate the file changes layout
            const layoutHtml = this.uiRenderer.generateFileChangesLayout(null, []);
            filesContent.innerHTML = layoutHtml;
            
            // Enable panel-content scrolling for regular commits
            if (panelContent) {
                panelContent.classList.remove('working-changes-mode');
            }
            
            // Update the footer separately - show for regular commits
            const filesFooter = document.getElementById('filesFooter');
            if (filesFooter) {
                filesFooter.style.display = 'block';
                filesFooter.innerHTML = this.uiRenderer.generateCommitDetailsHtml(null);
            }
        }
        this.selectedFileId = null;
    }

    // Compare options methods
    changeCompareOption(option) {
        this.compareAgainst = option;
        if (option === 'branch') {
            this.selectedCompareBranch = null;
        }
        
        // Cache the compare option
        if (this.cacheManager) {
            this.cacheManager.cacheCompareSettings();
        }
        
        // Refresh the file changes panel to update the compare header
        const selectedCommits = Array.from(this.selectedCommits);
        if (selectedCommits.length === 1) {
            this.showCommitFileChanges(selectedCommits[0]);
        } else if (selectedCommits.length > 1) {
            this.showMultiCommitFileChanges(selectedCommits);
        }
    }

    changeCompareBranch(branchName) {
        this.selectedCompareBranch = branchName;
        
        // Cache the selected branch
        if (this.cacheManager) {
            this.cacheManager.cacheCompareSettings();
        }
        
        // Refresh the file changes panel
        const selectedCommits = Array.from(this.selectedCommits);
        if (selectedCommits.length === 1) {
            this.showCommitFileChanges(selectedCommits[0]);
        } else if (selectedCommits.length > 1) {
            this.showMultiCommitFileChanges(selectedCommits);
        }
    }

    // New single dropdown handler
    changeCompareOptionSingle(value) {
        if (value === 'previous') {
            this.compareAgainst = 'previous';
            this.selectedCompareBranch = null;
        } else if (value === 'working') {
            this.compareAgainst = 'working';
            this.selectedCompareBranch = null;
        } else if (value.startsWith('branch:')) {
            const branchName = value.substring(7); // Remove 'branch:' prefix
            this.compareAgainst = 'branch';
            this.selectedCompareBranch = branchName;
        }
        
        // Cache the compare settings
        if (this.cacheManager) {
            this.cacheManager.cacheCompareSettings();
        }
        
        // Refresh the file changes panel
        const selectedCommits = Array.from(this.selectedCommits);
        if (selectedCommits.length === 1) {
            this.showCommitFileChanges(selectedCommits[0]);
        } else if (selectedCommits.length > 1) {
            this.showMultiCommitFileChanges(selectedCommits);
        }
    }

    changeCommitsCompareOption(branchName) {
        this.commitsCompareAgainst = branchName;
        
        // Cache the commits compare setting
        if (this.cacheManager) {
            this.cacheManager.cacheCompareSettings();
        }
        
        if (branchName === 'none') {
            // If no compare option selected, refresh current commits
            this.refreshData();
        } else {
            // Request commits with compare
            this.vscode.postMessage({
                command: 'getCommitsWithCompare',
                branch: this.currentBranch,
                compareBranch: branchName
            });
        }
    }

    getCurrentCommitHash() {
        // Return the first selected commit hash, or null if none selected
        if (this.selectedCommits.size > 0) {
            return Array.from(this.selectedCommits)[0];
        }
        return null;
    }

    clearDiffViewer() {
        const diffContent = document.getElementById('diffContent');
        if (diffContent) {
            diffContent.innerHTML = '<div class="empty-state"><h3>No diff selected</h3><p>Click on a file to view its changes</p></div>';
        }
    }

    restoreCompareDropdownState() {
        // Restore the compare dropdown state from cache
        const compareSelect = document.getElementById('commitsCompareFilter');
        if (compareSelect && this.commitsCompareAgainst) {
            compareSelect.value = this.commitsCompareAgainst;
            console.log('Restored compare dropdown state:', this.commitsCompareAgainst);
        }
    }


    // Setup refresh button
    setupRefreshButton() {
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.startRefreshAnimation();
                this.refreshData();
            });
        }
    }

    // Load UI with empty state immediately
    loadUIWithEmptyState() {
        // Populate dropdowns immediately if we have cached data
        this.populateDropdownsFromCache();
    }

    // Load data asynchronously
    async loadDataAsynchronously() {
        // Show loading states on panels
        this.showPanelLoadingStates();
        
        // Try to load from cache first (if available)
        let dataRestored = false;
        let stateRestored = false;
        let dropdownsRestored = false;
        let compareSettingsRestored = false;
        let panelSizesRestored = false;
        
        if (this.cacheManager) {
            dataRestored = this.cacheManager.restoreCachedData();
            stateRestored = this.cacheManager.restoreUIState();
            dropdownsRestored = this.cacheManager.restoreDropdownData();
            compareSettingsRestored = this.cacheManager.restoreCompareSettings();
            panelSizesRestored = this.cacheManager.restorePanelSizes();
        }
        
        if (dataRestored) {
            // Restore UI with cached data
            this.uiRenderer.updateContent(
                this.cacheManager.dataCache.branches, 
                this.cacheManager.dataCache.commits, 
                this.cacheManager.dataCache.stashes,
                null, // error
                this.cacheManager.dataCache.hasUncommittedChanges, 
                this.cacheManager.dataCache.hasStagedChanges
            );
            
            // Restore dropdown data
            if (dropdownsRestored) {
                this.populateDropdownsFromCache();
            }
            
            // Restore form values after a short delay to ensure DOM is ready
            setTimeout(() => {
                if (this.cacheManager) {
                    this.cacheManager.restoreSearchInputs();
                    this.cacheManager.restoreUserFilter();
                }
                this.restoreCompareDropdownState();
            }, 100);
            
            // Hide loading states
            this.hidePanelLoadingStates();
            
            // Check if cache is stale and refresh in background
            if (this.cacheManager && this.cacheManager.isCacheStale()) {
                // Cache is stale, refreshing in background
                this.refreshData();
            }
        } else {
            // No cached data, load from extension
            this.vscode.postMessage({ command: 'refresh' });
        }
    }

    // Show global loading spinner
    showPanelLoadingStates() {
        const globalSpinner = document.getElementById('globalLoadingSpinner');
        if (globalSpinner) {
            globalSpinner.style.display = 'flex';
        }
    }

    // Hide global loading spinner
    hidePanelLoadingStates() {
        const globalSpinner = document.getElementById('globalLoadingSpinner');
        if (globalSpinner) {
            globalSpinner.style.display = 'none';
        }
    }

    // Populate dropdowns from cache for instant UI
    populateDropdownsFromCache() {
        if (this.cacheManager && this.cacheManager.isDropdownCacheValid()) {
            // Populate user filter
            this.uiRenderer.filterRenderer.populateUserFilter();
            
            // Populate compare filter
            this.uiRenderer.filterRenderer.populateCommitsCompareFilter();
            
            // Populate files compare filter
            this.uiRenderer.filterRenderer.populateFilesCompareFilter();
            
            console.log('All dropdowns populated from cache');
        }
    }

    // Start refresh animation
    startRefreshAnimation() {
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.classList.add('refreshing');
            refreshButton.disabled = true;
            
            // Safety timeout to stop animation after 10 seconds
            setTimeout(() => {
                this.stopRefreshAnimation();
            }, 10000);
        }
    }

    // Stop refresh animation
    stopRefreshAnimation() {
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.classList.remove('refreshing');
            refreshButton.disabled = false;
        }
    }

}

// Global instance
let panelController;
