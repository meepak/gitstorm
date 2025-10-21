// CacheManager - Handles data persistence and caching for GitStorm
console.log('CacheManager.js: Script loading...');

class CacheManager {
    constructor(panelController) {
        this.panel = panelController;
        this.cacheKey = 'gitstorm-data-cache';
        this.maxCacheAge = 5 * 60 * 1000; // 5 minutes
        this.staleThreshold = 2 * 60 * 1000; // 2 minutes
        
        // Initialize cache structure
        this.dataCache = {
            branches: null,
            commits: null,
            currentFiles: null,
            selectedCommit: null,
            hasUncommittedChanges: false,
            hasStagedChanges: false,
            lastUpdateTime: null,
            isDataLoaded: false
        };
        
        // State persistence structure
        this.persistedState = {
            selectedCommits: new Set(),
            lastClickedCommit: null,
            searchTerm: '',
            commitsSearchTerm: '',
            filesSearchTerm: '',
            selectedUser: 'all',
            compareAgainst: 'working',
            selectedCompareBranch: null,
            commitsCompareAgainst: 'none',
            selectedFileId: null,
            currentBranch: null
        };
        
        // Dropdown data cache
        this.dropdownCache = {
            authors: [],
            compareBranches: [],
            lastUpdateTime: null,
            isPopulated: false
        };
    }

    // Cache data for persistence (optimized)
    cacheData(branches, commits, stashes, hasUncommittedChanges, hasStagedChanges) {
        // Use requestIdleCallback for non-blocking cache operations
        if (window.requestIdleCallback) {
            requestIdleCallback(() => {
                this._performCacheOperation(branches, commits, stashes, hasUncommittedChanges, hasStagedChanges);
            });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                this._performCacheOperation(branches, commits, stashes, hasUncommittedChanges, hasStagedChanges);
            }, 0);
        }
    }

    _performCacheOperation(branches, commits, stashes, hasUncommittedChanges, hasStagedChanges) {
        this.dataCache = {
            branches: branches ? [...branches] : null,
            commits: commits ? [...commits] : null,
            stashes: stashes ? [...stashes] : null,
            currentFiles: this.panel.currentFiles ? [...this.panel.currentFiles] : null,
            selectedCommit: this.panel.selectedCommit ? { ...this.panel.selectedCommit } : null,
            hasUncommittedChanges: hasUncommittedChanges,
            hasStagedChanges: hasStagedChanges,
            lastUpdateTime: Date.now(),
            isDataLoaded: true
        };
        
        // Save to localStorage for persistence across sessions
        try {
            const cacheData = {
                ...this.dataCache,
                selectedCommits: Array.from(this.panel.selectedCommits),
                currentBranch: this.panel.currentBranch,
                searchTerm: this.panel.searchTerm,
                commitsSearchTerm: this.panel.commitsSearchTerm,
                filesSearchTerm: this.panel.filesSearchTerm,
                selectedUser: this.panel.selectedUser,
                compareAgainst: this.panel.compareAgainst,
                selectedCompareBranch: this.panel.selectedCompareBranch,
                commitsCompareAgainst: this.panel.commitsCompareAgainst,
                selectedFileId: this.panel.selectedFileId
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            console.log('Data cached successfully');
        } catch (error) {
            console.warn('Failed to cache data to localStorage:', error);
        }
    }

    // Restore cached data
    restoreCachedData() {
        try {
            const cachedData = localStorage.getItem(this.cacheKey);
            console.log('CacheManager: Checking for cached data...', { hasCachedData: !!cachedData });
            
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                console.log('CacheManager: Parsed cached data:', { 
                    hasBranches: !!parsed.branches, 
                    hasCommits: !!parsed.commits,
                    lastUpdateTime: parsed.lastUpdateTime,
                    isDataLoaded: parsed.isDataLoaded
                });
                
                // Check if cache is recent
                const cacheAge = Date.now() - (parsed.lastUpdateTime || 0);
                console.log('CacheManager: Cache age:', cacheAge, 'ms, max age:', this.maxCacheAge, 'ms');
                
                if (cacheAge < this.maxCacheAge) {
                    console.log('CacheManager: Restoring cached data...');
                    
                    // Restore data cache
                    this.dataCache = {
                        branches: parsed.branches,
                        commits: parsed.commits,
                        stashes: parsed.stashes,
                        currentFiles: parsed.currentFiles,
                        selectedCommit: parsed.selectedCommit,
                        hasUncommittedChanges: parsed.hasUncommittedChanges,
                        hasStagedChanges: parsed.hasStagedChanges,
                        lastUpdateTime: parsed.lastUpdateTime,
                        isDataLoaded: parsed.isDataLoaded
                    };
                    
                    // Restore state
                    this.persistedState = {
                        selectedCommits: new Set(parsed.selectedCommits || []),
                        lastClickedCommit: parsed.lastClickedCommit,
                        searchTerm: parsed.searchTerm || '',
                        commitsSearchTerm: parsed.commitsSearchTerm || '',
                        filesSearchTerm: parsed.filesSearchTerm || '',
                        selectedUser: parsed.selectedUser || 'all',
                        compareAgainst: parsed.compareAgainst || 'working',
                        selectedCompareBranch: parsed.selectedCompareBranch,
                        commitsCompareAgainst: parsed.commitsCompareAgainst || 'none',
                        selectedFileId: parsed.selectedFileId,
                        currentBranch: parsed.currentBranch
                    };
                    
                    // Apply restored state to panel
                    this.applyStateToPanel();
                    
                    console.log('CacheManager: Cached data restored successfully');
                    return true;
                } else {
                    console.log('CacheManager: Cache is too old, will fetch fresh data');
                    this.clearCache();
                }
            } else {
                console.log('CacheManager: No cached data found');
            }
        } catch (error) {
            console.warn('CacheManager: Failed to restore cached data:', error);
            this.clearCache();
        }
        
        console.log('CacheManager: No data restored, returning false');
        return false;
    }

    // Apply restored state to panel instance
    applyStateToPanel() {
        // Restore data to panel instance variables
        this.panel.branches = this.dataCache.branches || [];
        this.panel.commits = this.dataCache.commits || [];
        this.panel.currentFiles = this.dataCache.currentFiles || [];
        this.panel.selectedCommit = this.dataCache.selectedCommit;
        this.panel.hasUncommittedChanges = this.dataCache.hasUncommittedChanges;
        this.panel.hasStagedChanges = this.dataCache.hasStagedChanges;
        
        // Restore state variables
        this.panel.currentBranch = this.persistedState.currentBranch;
        this.panel.selectedCommits = this.persistedState.selectedCommits;
        this.panel.lastClickedCommit = this.persistedState.lastClickedCommit;
        this.panel.searchTerm = this.persistedState.searchTerm;
        this.panel.commitsSearchTerm = this.persistedState.commitsSearchTerm;
        this.panel.filesSearchTerm = this.persistedState.filesSearchTerm;
        this.panel.selectedUser = this.persistedState.selectedUser;
        this.panel.compareAgainst = this.persistedState.compareAgainst;
        this.panel.selectedCompareBranch = this.persistedState.selectedCompareBranch;
        this.panel.commitsCompareAgainst = this.persistedState.commitsCompareAgainst;
        this.panel.selectedFileId = this.persistedState.selectedFileId;
    }

    // Restore UI state after data restoration (optimized for speed)
    restoreUIState() {
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
            // Restore branch selection
            if (this.panel.currentBranch) {
                this.panel.updateBranchHighlighting(this.panel.currentBranch);
            }
            
            // Restore commit selection
            this.panel.updateCommitSelection();
            
            // Restore file changes if there are selected commits
            if (this.panel.selectedCommits.size > 0) {
                const selectedHashes = Array.from(this.panel.selectedCommits);
                if (selectedHashes.length === 1) {
                    this.panel.showCommitFileChanges(selectedHashes[0]);
                } else if (selectedHashes.length > 1) {
                    this.panel.showMultiCommitFileChanges(selectedHashes);
                }
            }
            
            // Restore search terms and filters in next frame for better performance
            requestAnimationFrame(() => {
                this.restoreSearchInputs();
                this.restoreUserFilter();
                this.panel.restoreCompareDropdownState();
                console.log('UI state restored');
            });
        });
    }

    // Restore search input values
    restoreSearchInputs() {
        const branchesSearchInput = document.getElementById('branchesSearch');
        if (branchesSearchInput && this.panel.searchTerm) {
            branchesSearchInput.value = this.panel.searchTerm;
        }
        
        const commitsSearchInput = document.getElementById('commitsSearch');
        if (commitsSearchInput && this.panel.commitsSearchTerm) {
            commitsSearchInput.value = this.panel.commitsSearchTerm;
        }
        
        const filesSearchInput = document.getElementById('filesSearch');
        if (filesSearchInput && this.panel.filesSearchTerm) {
            filesSearchInput.value = this.panel.filesSearchTerm;
        }
    }

    // Restore user filter
    restoreUserFilter() {
        const userFilter = document.getElementById('userFilter');
        if (userFilter && this.panel.selectedUser) {
            userFilter.value = this.panel.selectedUser;
        }
    }

    // Check if cache is stale
    isCacheStale() {
        const cacheAge = Date.now() - (this.dataCache.lastUpdateTime || 0);
        return cacheAge > this.staleThreshold;
    }

    // Handle visibility change - refresh data if cache is stale (optimized)
    handleVisibilityChange() {
        // Show loading states for instant feedback
        this.panel.showPanelLoadingStates();
        
        // If we don't have cached data, try to restore it first
        if (!this.dataCache.isDataLoaded) {
            const restored = this.restoreCachedData();
            if (restored) {
                console.log('Restored data from cache on visibility change');
                // Restore UI immediately
                this.panel.uiRenderer.updateContent(
                    this.dataCache.branches, 
                    this.dataCache.commits, 
                    this.dataCache.stashes,
                    null, // error
                    this.dataCache.hasUncommittedChanges, 
                    this.dataCache.hasStagedChanges
                );
                this.restoreUIState();
                this.panel.hidePanelLoadingStates();
                return true;
            }
        }
        
        // Check if cache is stale
        if (this.isCacheStale()) {
            console.log('Cache is stale, refreshing data...');
            this.panel.refreshData();
            return false;
        } else {
            console.log('Cache is still fresh, no refresh needed');
            this.panel.hidePanelLoadingStates();
            return true;
        }
    }

    // Clear cache
    clearCache() {
        this.dataCache = {
            branches: null,
            commits: null,
            currentFiles: null,
            selectedCommit: null,
            hasUncommittedChanges: false,
            hasStagedChanges: false,
            lastUpdateTime: null,
            isDataLoaded: false
        };
        localStorage.removeItem(this.cacheKey);
        console.log('Cache cleared');
    }

    // Get cache status
    getCacheStatus() {
        return {
            isLoaded: this.dataCache.isDataLoaded,
            lastUpdate: this.dataCache.lastUpdateTime,
            age: this.dataCache.lastUpdateTime ? Date.now() - this.dataCache.lastUpdateTime : null,
            isStale: this.isCacheStale()
        };
    }

    // Cache dropdown data
    cacheDropdownData(commits, branches) {
        if (commits && commits.length > 0) {
            // Extract unique authors
            const authors = [...new Set(commits.map(commit => commit.author))].sort();
            this.dropdownCache.authors = authors;
        }
        
        if (branches && branches.length > 0) {
            // Extract branch names for compare dropdown
            const compareBranches = branches.map(branch => ({
                name: branch.name,
                displayName: branch.isRemote ? branch.name.split('/').slice(1).join('/') : branch.name,
                isRemote: branch.isRemote
            }));
            this.dropdownCache.compareBranches = compareBranches;
        }
        
        this.dropdownCache.lastUpdateTime = Date.now();
        this.dropdownCache.isPopulated = true;
        
        console.log('Dropdown data cached:', {
            authors: this.dropdownCache.authors.length,
            compareBranches: this.dropdownCache.compareBranches.length
        });
    }

    // Get cached authors
    getCachedAuthors() {
        return this.dropdownCache.authors || [];
    }

    // Get cached compare branches
    getCachedCompareBranches() {
        return this.dropdownCache.compareBranches || [];
    }

    // Check if dropdown cache is valid
    isDropdownCacheValid() {
        return this.dropdownCache.isPopulated && 
               this.dropdownCache.authors.length > 0 && 
               this.dropdownCache.compareBranches.length > 0;
    }

    // Clear dropdown cache
    clearDropdownCache() {
        this.dropdownCache = {
            authors: [],
            compareBranches: [],
            lastUpdateTime: null,
            isPopulated: false
        };
    }

    // Cache compare settings
    cacheCompareSettings() {
        try {
            const compareSettings = {
                compareAgainst: this.panel.compareAgainst,
                selectedCompareBranch: this.panel.selectedCompareBranch,
                commitsCompareAgainst: this.panel.commitsCompareAgainst,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gitstorm-compare-settings', JSON.stringify(compareSettings));
        } catch (error) {
            console.error('Error caching compare settings:', error);
        }
    }

    // Restore compare settings
    restoreCompareSettings() {
        try {
            const saved = localStorage.getItem('gitstorm-compare-settings');
            if (saved) {
                const data = JSON.parse(saved);
                this.panel.compareAgainst = data.compareAgainst || 'working';
                this.panel.selectedCompareBranch = data.selectedCompareBranch || null;
                this.panel.commitsCompareAgainst = data.commitsCompareAgainst || 'none';
                return true;
            }
        } catch (error) {
            console.error('Error restoring compare settings:', error);
        }
        return false;
    }

    // Cache panel sizes
    cachePanelSizes() {
        try {
            localStorage.setItem('gitstorm-panel-sizes', JSON.stringify(this.panel.panelSizes));
        } catch (error) {
            console.error('Error caching panel sizes:', error);
        }
    }

    // Restore panel sizes
    restorePanelSizes() {
        try {
            const saved = localStorage.getItem('gitstorm-panel-sizes');
            if (saved) {
                this.panel.panelSizes = JSON.parse(saved);
                return true;
            }
        } catch (error) {
            console.error('Error restoring panel sizes:', error);
        }
        return false;
    }

    // Cache UI state
    cacheUIState() {
        try {
            const stateData = {
                selectedCommits: Array.from(this.panel.selectedCommits),
                lastClickedCommit: this.panel.lastClickedCommit,
                searchTerm: this.panel.searchTerm,
                commitsSearchTerm: this.panel.commitsSearchTerm,
                filesSearchTerm: this.panel.filesSearchTerm,
                selectedUser: this.panel.selectedUser,
                selectedFileId: this.panel.selectedFileId,
                currentBranch: this.panel.currentBranch,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gitstorm-ui-state', JSON.stringify(stateData));
        } catch (error) {
            console.error('Error caching UI state:', error);
        }
    }

    // Restore UI state
    restoreUIState() {
        try {
            const saved = localStorage.getItem('gitstorm-ui-state');
            if (saved) {
                const data = JSON.parse(saved);
                this.panel.selectedCommits = new Set(data.selectedCommits || []);
                this.panel.lastClickedCommit = data.lastClickedCommit || null;
                this.panel.searchTerm = data.searchTerm || '';
                this.panel.commitsSearchTerm = data.commitsSearchTerm || '';
                this.panel.filesSearchTerm = data.filesSearchTerm || '';
                this.panel.selectedUser = data.selectedUser || 'all';
                this.panel.selectedFileId = data.selectedFileId || null;
                this.panel.currentBranch = data.currentBranch || null;
                return true;
            }
        } catch (error) {
            console.error('Error restoring UI state:', error);
        }
        return false;
    }

    // Restore dropdown data
    restoreDropdownData() {
        // This method is called to populate dropdowns from cache
        // The actual dropdown population is handled by populateDropdownsFromCache in PanelController
        return this.isDropdownCacheValid();
    }

    // Cache branch sections collapsed state
    cacheBranchSections() {
        try {
            const sectionsState = {
                collapsedSections: this.panel.collapsedSections,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gitstorm-branch-sections', JSON.stringify(sectionsState));
        } catch (error) {
            console.error('Error caching branch sections:', error);
        }
    }

    // Restore branch sections collapsed state
    restoreBranchSections() {
        try {
            const saved = localStorage.getItem('gitstorm-branch-sections');
            if (saved) {
                const data = JSON.parse(saved);
                this.panel.collapsedSections = data.collapsedSections || { stashes: true };
                return true;
            }
        } catch (error) {
            console.error('Error restoring branch sections:', error);
        }
        return false;
    }
}

// Make CacheManager globally available for debugging
window.CacheManager = CacheManager;
console.log('CacheManager.js: Script loaded and CacheManager made globally available');
