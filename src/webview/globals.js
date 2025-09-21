// Global Functions - Functions that need to be accessible from HTML onclick handlers
// These functions delegate to the panel controller and its components

// SVG Icon Loading - Global function to load SVG icons for dynamically generated content
function loadSvgIcons() {
    if (window.assetsBaseUri) {
        const icons = document.querySelectorAll('[class*="-icon"][data-icon]');
        icons.forEach(icon => {
            const iconType = icon.getAttribute('data-icon');
            if (iconType && !icon.src) { // Only load if not already loaded
                const svgPath = `${window.assetsBaseUri}/${iconType}.svg`;
                icon.src = svgPath;
                // Apply consistent styling
                icon.style.width = '16px';
                icon.style.height = '16px';
                icon.style.marginRight = '6px';
                icon.style.verticalAlign = 'middle';
            }
        });
    }
}

// Auto-load SVG icons when new elements are added to the DOM
function setupSvgIconObserver() {
    if (window.assetsBaseUri) {
        const observer = new MutationObserver((mutations) => {
            let shouldLoadIcons = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if any added nodes contain panel icons
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && Array.from(node.classList).some(cls => cls.endsWith('-icon')) && node.hasAttribute('data-icon')) {
                                shouldLoadIcons = true;
                            } else if (node.querySelector && node.querySelector('[class*="-icon"][data-icon]')) {
                                shouldLoadIcons = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldLoadIcons) {
                loadSvgIcons();
            }
        });
        
        // Start observing the entire document for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Branch operations
function selectBranch(branchName) {
    panelController.selectBranch(branchName);
}

function showBranchContextMenu(event, branchName) {
    event.preventDefault();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'branch', { branchName });
}

// Commit operations
function selectCommit(commitHash, event = null) {
    const isMultiSelect = event && event.ctrlKey;
    const isRangeSelect = event && event.shiftKey;
    panelController.selectCommit(commitHash, isMultiSelect, isRangeSelect);
}

function showCommitContextMenu(event, commitHash) {
    event.preventDefault();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'commit', { commitHash });
}

function selectUncommittedChanges() {
    panelController.gitOperations.selectUncommittedChanges();
}

function showUncommittedChangesContextMenu(event) {
    event.preventDefault();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'uncommitted', {});
}

// File operations
function selectFile(fileName, commitHash) {
    panelController.gitOperations.selectFile(fileName, commitHash);
}

function selectFileOnly(fileName) {
    panelController.gitOperations.selectFileOnly(fileName);
}

function showFileContextMenu(event, fileName, commitHash) {
    event.preventDefault();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'file', { fileName, commitHash });
}

function showDiffFileContextMenu(event, fileName, commitHash) {
    event.preventDefault();
    event.stopPropagation();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'diff-file', { fileName, commitHash });
}

function toggleDirectory(dirId) {
    const children = document.getElementById(dirId);
    const toggle = document.getElementById(`toggle-${dirId}`);
    
    if (children && toggle) {
        const isExpanded = children.style.display !== 'none';
        
        if (isExpanded) {
            children.style.display = 'none';
            toggle.textContent = '▶';
        } else {
            children.style.display = 'block';
            toggle.textContent = '▼';
        }
    }
}

function showDirectoryContextMenu(event, directoryName) {
    event.preventDefault();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'directory', { directoryName });
}

// Panel operations
function showPanelContextMenu(event, panelType) {
    event.preventDefault();
    panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'panel', { panelType });
}

// Search operations
function clearSearch() {
    panelController.searchManager.clearAllFilters();
}

function clearBranchesSearch() {
    const input = document.getElementById('branchesSearch');
    if (input) {
        input.value = '';
        panelController.searchTerm = '';
        panelController.searchManager.filterBranches();
    }
}

function clearCommitsSearch() {
    const input = document.getElementById('commitsSearch');
    if (input) {
        input.value = '';
        panelController.commitsSearchTerm = '';
        panelController.searchManager.filterCommits();
    }
}

function clearFilesSearch() {
    const input = document.getElementById('filesSearch');
    if (input) {
        input.value = '';
        panelController.filesSearchTerm = '';
        panelController.searchManager.filterFiles();
    }
}

// Utility functions
function refreshData() {
    panelController.refreshData();
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
    }
}

// File changes panel functions
function showWorkingDirectoryChanges() {
    panelController.gitOperations.selectUncommittedChanges();
}

function changeCompareOption(value) {
    panelController.changeCompareOption(value);
}

function changeCompareBranch(value) {
    panelController.changeCompareBranch(value);
}

function changeCompareOptionSingle(value) {
    panelController.changeCompareOptionSingle(value);
}

function changeCommitsCompareOption(value) {
    panelController.changeCommitsCompareOption(value);
}

// Missing functions from original
function showSquashDialog() {
    panelController.gitOperations.showSquashDialog();
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const isVisible = section.style.display !== 'none';
        section.style.display = isVisible ? 'none' : 'block';
    }
}

function toggleFileTreeItem(element) {
    const children = element.parentNode.querySelectorAll(':scope > .file-tree-item:not(.directory)');
    const isExpanded = element.classList.contains('expanded');
    
    if (isExpanded) {
        element.classList.remove('expanded');
        children.forEach(child => child.style.display = 'none');
    } else {
        element.classList.add('expanded');
        children.forEach(child => child.style.display = 'block');
    }
}

function showFileDiff(filePath, commitHash) {
    panelController.gitOperations.showFileDiff(filePath, commitHash);
}

function showMultiCommitFileDiff(filePath, commitHashes) {
    panelController.gitOperations.showMultiCommitFileDiff(filePath, commitHashes);
}

function showFileDiffWithCompare(filePath, fileId) {
    panelController.gitOperations.showFileDiffWithCompare(filePath, fileId);
}

function showEditableDiff(filePath, fileId) {
    panelController.gitOperations.showEditableDiff(filePath, fileId);
}

function openWorkingFile(filePath) {
    panelController.gitOperations.openFile(filePath);
}

// ===== BUTTON SPINNER MANAGEMENT =====
function setButtonLoading(buttonSelector, isLoading) {
    const button = document.querySelector(buttonSelector);
    if (button) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}

function setAllButtonsLoading(buttonSelectors, isLoading) {
    buttonSelectors.forEach(selector => {
        setButtonLoading(selector, isLoading);
    });
}

// New functions for uncommitted changes management
function stageAllChanges() {
    // Set loading state for stage all button
    setButtonLoading('.stage-all-btn', true);
    
    panelController.gitOperations.stageAllChanges();
}

function unstageAllChanges() {
    console.log('=== FRONTEND UNSTAGE ALL DEBUG ===');
    console.log('unstageAllChanges function called');
    console.log('panelController:', !!panelController);
    console.log('panelController.gitOperations:', !!panelController?.gitOperations);
    
    // Set loading state for unstage all button
    setButtonLoading('.unstage-all-btn', true);
    
    if (panelController && panelController.gitOperations) {
        console.log('Calling panelController.gitOperations.unstageAllChanges()');
        panelController.gitOperations.unstageAllChanges();
    } else {
        console.error('panelController or gitOperations not available');
        // Reset loading state on error
        setButtonLoading('.unstage-all-btn', false);
    }
    console.log('=== END FRONTEND UNSTAGE ALL DEBUG ===');
}

function discardAllChanges() {
    panelController.gitOperations.discardAllChanges();
}

// Individual file action functions
function stageFile(filePath) {
    // Set loading state for the specific stage button
    const stageBtn = document.querySelector(`button[onclick*="stageFile('${filePath}')"]`);
    if (stageBtn) {
        setButtonLoading(`button[onclick*="stageFile('${filePath}')"]`, true);
    }
    
    panelController.gitOperations.stageFile(filePath);
}

function unstageFile(filePath) {
    // Set loading state for the specific unstage button
    const unstageBtn = document.querySelector(`button[onclick*="unstageFile('${filePath}')"]`);
    if (unstageBtn) {
        setButtonLoading(`button[onclick*="unstageFile('${filePath}')"]`, true);
    }
    
    panelController.gitOperations.unstageFile(filePath);
}

// Toggle section collapse/expand
function toggleSection(sectionId) {
    const sectionHeader = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
    const sectionContent = document.getElementById(sectionId === 'uncommittedChangesSection' ? 'uncommittedChangesList' : 'stagedChangesList');
    
    if (sectionHeader && sectionContent) {
        const isCollapsed = sectionHeader.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand section
            sectionHeader.classList.remove('collapsed');
            sectionContent.classList.remove('collapsed');
        } else {
            // Collapse section
            sectionHeader.classList.add('collapsed');
            sectionContent.classList.add('collapsed');
        }
    }
}

// Initialize when DOM is ready and all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure all scripts are loaded
    setTimeout(() => {
        initializePanel();
    }, 50);
});

function initializePanel() {
    // Check if we're in a webview environment
    if (window.location.protocol === 'vscode-webview:') {
        console.log('Running in VSCode webview environment');
    }
    
    if (typeof CacheManager === 'undefined') {
        console.error('CacheManager not loaded, retrying...');
        setTimeout(() => {
            if (typeof CacheManager === 'undefined') {
                console.error('CacheManager still not loaded after retry. Some features may not work.');
                console.error('This might be due to webview caching issues. Try restarting VSCode.');
                // Initialize without CacheManager as fallback
                try {
                    panelController = new PanelController();
                    console.log('GitStorm Panel initialized (without CacheManager)');
                } catch (error) {
                    console.error('Failed to initialize PanelController:', error);
                }
            } else {
                panelController = new PanelController();
                console.log('GitStorm Panel initialized');
            }
        }, 200);
    } else {
        try {
            panelController = new PanelController();
            console.log('GitStorm Panel initialized');
        } catch (error) {
            console.error('Failed to initialize PanelController:', error);
        }
    }
}

// Export for debugging
window.panelController = null;
window.selectBranch = selectBranch;
window.selectCommit = selectCommit;
window.selectUncommittedChanges = selectUncommittedChanges;
window.selectFile = selectFile;
window.selectFileOnly = selectFileOnly;
window.toggleDirectory = toggleDirectory;
window.showBranchContextMenu = showBranchContextMenu;
window.showCommitContextMenu = showCommitContextMenu;
window.showUncommittedChangesContextMenu = showUncommittedChangesContextMenu;
window.showFileContextMenu = showFileContextMenu;
window.showDiffFileContextMenu = showDiffFileContextMenu;
window.showDirectoryContextMenu = showDirectoryContextMenu;
window.showPanelContextMenu = showPanelContextMenu;
window.clearSearch = clearSearch;
window.clearBranchesSearch = clearBranchesSearch;
window.clearCommitsSearch = clearCommitsSearch;
window.clearFilesSearch = clearFilesSearch;
window.refreshData = refreshData;
window.togglePanel = togglePanel;
window.showWorkingDirectoryChanges = showWorkingDirectoryChanges;
window.changeCompareOption = changeCompareOption;
window.changeCompareBranch = changeCompareBranch;
window.changeCompareOptionSingle = changeCompareOptionSingle;
window.changeCommitsCompareOption = changeCommitsCompareOption;
window.showSquashDialog = showSquashDialog;
window.toggleSection = toggleSection;
window.toggleFileTreeItem = toggleFileTreeItem;
window.showFileDiff = showFileDiff;
window.showMultiCommitFileDiff = showMultiCommitFileDiff;
window.showFileDiffWithCompare = showFileDiffWithCompare;
window.showEditableDiff = showEditableDiff;
window.openWorkingFile = openWorkingFile;
window.stageAllChanges = stageAllChanges;
window.unstageAllChanges = unstageAllChanges;
window.discardAllChanges = discardAllChanges;
window.stageFile = stageFile;
window.unstageFile = unstageFile;
