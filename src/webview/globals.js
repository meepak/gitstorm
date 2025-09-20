// Global Functions - Functions that need to be accessible from HTML onclick handlers
// These functions delegate to the panel controller and its components

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
    panelController.selectCommit(commitHash, isMultiSelect);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    panelController = new PanelController();
    console.log('GitStorm Panel initialized');
});

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
