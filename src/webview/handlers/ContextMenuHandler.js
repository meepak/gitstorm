// Context Menu Handler - Handles all context menu functionality
class ContextMenuHandler {
    constructor(panelController) {
        this.panel = panelController;
        this.contextMenu = null;
        this.contextMenuData = null;
    }

    setupContextMenu() {
        this.contextMenu = document.getElementById('contextMenu');
        this.contextMenuData = null;

        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
        
        this.contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                this.handleContextMenuAction(action);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
                setTimeout(() => {
                    this.showContextMenu(e.clientX, e.clientY, 'text', { text: selection.toString() });
                }, 100);
            }
        });
        
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('[oncontextmenu]')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, 'default', {});
            }
        });
    }

    showContextMenu(x, y, type, data) {
        this.contextMenuData = { type, data };
        
        // Hide all menu items first
        this.hideAllContextMenuItems();
        
        // Show relevant items based on type
        switch (type) {
            case 'branch':
                this.showBranchContextMenu();
                break;
            case 'commit':
                this.showCommitContextMenu();
                break;
            case 'file':
                this.showFileContextMenu();
                break;
            case 'directory':
                this.showDirectoryContextMenu();
                break;
            case 'panel':
                this.showPanelContextMenu();
                break;
            case 'uncommitted':
                this.showUncommittedChangesContextMenu();
                break;
            case 'staged':
                this.showStagedChangesContextMenu();
                break;
            case 'text':
                this.showTextContextMenu();
                break;
            default:
                this.showDefaultContextMenu();
        }
        
        // Position the context menu
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
        this.contextMenuData = null;
    }

    hideAllContextMenuItems() {
        const items = this.contextMenu.querySelectorAll('.context-menu-item');
        items.forEach(item => {
            item.style.display = 'none';
        });
    }

    showBranchContextMenu() {
        // Show branch-specific actions
        this.contextMenu.querySelector('[data-action="checkout"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="merge"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="delete-branch"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showCommitContextMenu() {
        // Show commit-specific actions
        this.contextMenu.querySelector('[data-action="create-branch"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="cherry-pick"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="revert"]').style.display = 'flex';
        
        // Show squash option only if multiple commits are selected
        if (this.panel.selectedCommits.size > 1) {
            this.contextMenu.querySelector('[data-action="squash"]').style.display = 'flex';
        }
        
        // Show push option for local commits
        if (this.contextMenuData && this.contextMenuData.data && this.contextMenuData.data.isLocal) {
            this.contextMenu.querySelector('[data-action="push"]').style.display = 'flex';
        }
        
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showFileContextMenu() {
        // Show file-specific actions
        this.contextMenu.querySelector('[data-action="open"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="diff"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="copy-path"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="reveal"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showDirectoryContextMenu() {
        // Show directory-specific actions
        this.contextMenu.querySelector('[data-action="copy-path"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="reveal"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showPanelContextMenu() {
        // Show panel-specific actions
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showUncommittedChangesContextMenu() {
        // Show uncommitted changes-specific actions
        this.contextMenu.querySelector('[data-action="stage-all"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="stash"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showStagedChangesContextMenu() {
        // Show staged changes-specific actions
        this.contextMenu.querySelector('[data-action="commit-staged"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="unstage-all"]').style.display = 'flex';
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    showTextContextMenu() {
        // Show text-specific actions
        this.contextMenu.querySelector('[data-action="copy"]').style.display = 'flex';
    }

    showDefaultContextMenu() {
        // Show default actions
        this.contextMenu.querySelector('[data-action="refresh"]').style.display = 'flex';
    }

    handleContextMenuAction(action) {
        const { type, data } = this.contextMenuData;
        
        switch (action) {
            case 'copy':
                this.panel.gitOperations.copyToClipboard(data.text);
                break;
            case 'open':
                if (type === 'file') {
                    this.panel.gitOperations.openFile(data.fileName);
                }
                break;
            case 'diff':
                if (type === 'file') {
                    this.panel.gitOperations.showFileDiff(data.fileName, data.commitHash);
                }
                break;
            case 'copy-path':
                if (type === 'file' || type === 'directory') {
                    this.panel.gitOperations.copyToClipboard(data.fileName);
                }
                break;
            case 'reveal':
                if (type === 'file') {
                    this.panel.gitOperations.revealFileInExplorer(data.fileName);
                } else if (type === 'directory') {
                    this.panel.gitOperations.revealDirectoryInExplorer(data.directoryName);
                }
                break;
            case 'checkout':
                if (type === 'branch') {
                    this.panel.gitOperations.checkoutBranch(data.branchName);
                }
                break;
            case 'merge':
                if (type === 'branch') {
                    this.panel.gitOperations.mergeBranch(data.branchName);
                }
                break;
            case 'delete-branch':
                if (type === 'branch') {
                    this.panel.gitOperations.deleteBranch(data.branchName);
                }
                break;
            case 'create-branch':
                if (type === 'commit') {
                    this.panel.gitOperations.createBranchFromCommit(data.commitHash);
                }
                break;
            case 'cherry-pick':
                if (type === 'commit') {
                    this.panel.gitOperations.cherryPickCommit(data.commitHash);
                }
                break;
            case 'revert':
                if (type === 'commit') {
                    this.panel.gitOperations.revertCommit(data.commitHash);
                }
                break;
            case 'squash':
                if (type === 'commit') {
                    this.panel.gitOperations.squashCommits();
                }
                break;
            case 'commit':
                if (type === 'uncommitted') {
                    this.panel.gitOperations.commitChanges();
                }
                break;
            case 'stage-all':
                if (type === 'uncommitted') {
                    this.panel.gitOperations.stageAllChanges();
                }
                break;
            case 'stash':
                if (type === 'uncommitted') {
                    this.panel.gitOperations.stashChanges();
                }
                break;
            case 'commit-staged':
                if (type === 'staged') {
                    this.panel.gitOperations.showCommitPopup();
                }
                break;
            case 'unstage-all':
                if (type === 'staged') {
                    this.panel.gitOperations.unstageAllChanges();
                }
                break;
            case 'push':
                if (type === 'commit') {
                    this.panel.gitOperations.pushCommit(data.commitHash);
                }
                break;
            case 'refresh':
                this.panel.refreshData();
                break;
        }
        
        this.hideContextMenu();
    }
}
