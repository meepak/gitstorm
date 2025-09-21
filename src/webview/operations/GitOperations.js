// Git Operations - Handles all Git-related operations and file operations
console.log('🚀🚀🚀 UPDATED GitOperations.js loaded at:', new Date().toISOString());

class GitOperations {
    constructor(panelController) {
        this.panel = panelController;
        this.confirmationDialog = null; // Initialize lazily
        
        // Debug: Check if ConfirmationDialog is available at construction time
        console.log('GitOperations constructor: ConfirmationDialog available:', typeof ConfirmationDialog !== 'undefined');
        console.log('GitOperations constructor: Document ready state:', document.readyState);
        console.log('GitOperations constructor: All scripts loaded:', document.scripts.length);
    }

    // Lazy initialization of confirmation dialog
    getConfirmationDialog() {
        if (!this.confirmationDialog) {
            // Check if ConfirmationDialog is available
            if (typeof ConfirmationDialog !== 'undefined') {
                this.confirmationDialog = new ConfirmationDialog();
            } else {
                console.error('ConfirmationDialog class not available');
                console.log('Available window objects:', Object.keys(window).filter(key => key.includes('Dialog') || key.includes('Confirmation')));
                console.log('Script loading status:', document.readyState);
                return null;
            }
        }
        return this.confirmationDialog;
    }

    // File operations
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('Text copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    openFile(fileName) {
        // Get the absolute path by combining with workspace root
        const workspaceRoot = this.panel.workspaceRoot || '';
        const absolutePath = workspaceRoot ? `${workspaceRoot}/${fileName}` : fileName;
        this.panel.messageHandler.sendMessage('openFile', { fileName: absolutePath });
    }

    showFileDiff(fileName, commitHash) {
        // For uncommitted changes (when commitHash is null), always use working directory comparison
        let compareAgainst = this.panel.compareAgainst || 'previous';
        let compareBranch = this.panel.selectedCompareBranch || null;
        
        if (commitHash === null) {
            // This is for uncommitted changes, use working directory comparison
            compareAgainst = 'working';
            compareBranch = null;
        }
        
        this.panel.messageHandler.sendMessage('showFileDiff', { 
            filePath: fileName, 
            commitHash,
            compareAgainst: compareAgainst,
            compareBranch: compareBranch
        });
    }

    showMultiCommitFileDiff(filePath, commitHashes) {
        console.log('Show multi-commit file diff for:', filePath, 'commits:', commitHashes);
        this.panel.messageHandler.sendMessage('showMultiCommitFileDiff', {
            filePath: filePath,
            commitHashes: commitHashes
        });
    }

    showFileDiffWithCompare(filePath, fileId) {
        console.log('Show file diff with file ID:', filePath, fileId);
        
        // Update selected file highlighting
        this.updateFileSelection(fileId);
        
        // Get the compare data from the stored data
        const compareData = this.panel.fileCompareData && this.panel.fileCompareData[fileId];
        if (!compareData) {
            console.error('No compare data found for file ID:', fileId);
            return;
        }
        
        console.log('Compare data:', compareData);
        this.panel.messageHandler.sendMessage('showFileDiffWithCompare', {
            filePath: filePath,
            compareData: compareData
        });
    }

    showFileDiffWithWorking(fileName, commitHash) {
        console.log('Show file diff with working directory:', fileName, 'commit:', commitHash);
        this.panel.messageHandler.sendMessage('showFileDiffWithWorking', {
            filePath: fileName,
            commitHash: commitHash
        });
    }

    showFileDiffWithBranch(fileName, commitHash) {
        console.log('Show file diff with branch:', fileName, 'commit:', commitHash);
        this.panel.messageHandler.sendMessage('showFileDiffWithBranch', {
            filePath: fileName,
            commitHash: commitHash
        });
    }

    showEditableDiff(filePath, fileId) {
        console.log('Show editable diff for:', filePath, fileId);
        
        // Get the compare data from the stored data
        const compareData = this.panel.fileCompareData && this.panel.fileCompareData[fileId];
        if (!compareData) {
            console.error('No compare data found for file ID:', fileId);
            return;
        }
        
        console.log('Editable diff compare data:', compareData);
        this.panel.messageHandler.sendMessage('showEditableDiff', {
            filePath: filePath,
            compareData: compareData
        });
    }

    updateFileSelection(fileId) {
        // Update file selection highlighting
        const fileItems = document.querySelectorAll('.file-tree-item');
        fileItems.forEach(item => {
            item.classList.remove('selected');
            // Check if this item corresponds to the selected file
            const dataFileId = item.getAttribute('data-file-id');
            if (dataFileId === fileId) {
                item.classList.add('selected');
            }
        });
        
        this.panel.selectedFileId = fileId;
        console.log('Selected file:', fileId);
    }

    showCommitDiff(commitHash) {
        this.panel.messageHandler.sendMessage('getCommitDiff', { 
            commitHash 
        });
    }

    revealFileInExplorer(fileName) {
        // Get the absolute path by combining with workspace root
        const workspaceRoot = this.panel.workspaceRoot || '';
        const absolutePath = workspaceRoot ? `${workspaceRoot}/${fileName}` : fileName;
        this.panel.messageHandler.sendMessage('revealFileInExplorer', { filePath: absolutePath });
    }

    revealDirectoryInExplorer(directoryName) {
        this.panel.messageHandler.sendMessage('revealDirectoryInExplorer', { directoryName });
    }

    openFileInVSCode(fileName) {
        // Get the absolute path by combining with workspace root
        const workspaceRoot = this.panel.workspaceRoot || '';
        const absolutePath = workspaceRoot ? `${workspaceRoot}/${fileName}` : fileName;
        this.panel.messageHandler.sendMessage('openFileInVSCode', { fileName: absolutePath });
    }

    openDiffInVSCode(fileName, commitHash) {
        // Get the absolute path by combining with workspace root
        const workspaceRoot = this.panel.workspaceRoot || '';
        const absolutePath = workspaceRoot ? `${workspaceRoot}/${fileName}` : fileName;
        this.panel.messageHandler.sendMessage('openDiffInVSCode', { 
            fileName: absolutePath, 
            commitHash: commitHash 
        });
    }

    openFileAtCommit(fileName, commitHash) {
        // Get the absolute path by combining with workspace root
        const workspaceRoot = this.panel.workspaceRoot || '';
        const absolutePath = workspaceRoot ? `${workspaceRoot}/${fileName}` : fileName;
        this.panel.messageHandler.sendMessage('openFileAtCommit', { 
            fileName: absolutePath, 
            commitHash: commitHash 
        });
    }

    // Branch operations
    checkoutBranch(branchName) {
        console.log('Checking out branch:', branchName);
        this.panel.messageHandler.sendMessage('checkoutBranch', { branchName });
        
        // Refresh data after checkout and select the newly checked out branch
        setTimeout(() => {
            this.panel.refreshData();
            setTimeout(() => {
                this.panel.selectBranch(branchName);
            }, 500);
        }, 1000);
    }

    mergeBranch(branchName) {
        console.log('Merging branch:', branchName);
        this.panel.messageHandler.sendMessage('mergeBranch', { branchName });
    }

    deleteBranch(branchName) {
        console.log('Deleting branch:', branchName);
        const dialog = this.getConfirmationDialog();
        if (dialog) {
            dialog.show(
                `Are you sure you want to delete branch "${branchName}"?`,
                'Delete Branch',
                {
                    confirmText: 'Delete',
                    confirmButtonClass: 'danger-btn'
                },
                (confirmed) => {
                    if (confirmed) {
                        this.panel.messageHandler.sendMessage('deleteBranch', { branchName });
                    }
                }
            );
        } else {
            // Retry after a short delay if ConfirmationDialog is not ready
            console.log('ConfirmationDialog not ready, retrying in 200ms...');
            setTimeout(() => {
                const retryDialog = this.getConfirmationDialog();
                if (retryDialog) {
                    retryDialog.show(
                        `Are you sure you want to delete branch "${branchName}"?`,
                        'Delete Branch',
                        {
                            confirmText: 'Delete',
                            confirmButtonClass: 'danger-btn'
                        },
                        (confirmed) => {
                            if (confirmed) {
                                this.panel.messageHandler.sendMessage('deleteBranch', { branchName });
                            }
                        }
                    );
                } else {
                    console.error('ConfirmationDialog still not available, proceeding without confirmation');
                    this.panel.messageHandler.sendMessage('deleteBranch', { branchName });
                }
            }, 200);
        }
    }

    // Commit operations
    createBranchFromCommit(commitHash) {
        console.log('Creating branch from commit:', commitHash);
        const branchName = prompt('Enter new branch name:');
        if (branchName && branchName.trim()) {
            this.panel.messageHandler.sendMessage('createBranchFromCommit', { 
                commitHash,
                branchName: branchName.trim()
            });
        }
    }

    cherryPickCommit(commitHash) {
        console.log('Cherry-picking commit:', commitHash);
        this.panel.messageHandler.sendMessage('cherryPickCommit', { commitHash });
    }

    revertCommit(commitHash) {
        console.log('Reverting commit:', commitHash);
        const dialog = this.getConfirmationDialog();
        if (dialog) {
            dialog.show(
                'Are you sure you want to revert this commit?',
                'Revert Commit',
                {
                    confirmText: 'Revert',
                    confirmButtonClass: 'danger-btn'
                },
                (confirmed) => {
                    if (confirmed) {
                        this.panel.messageHandler.sendMessage('revertCommit', { commitHash });
                    }
                }
            );
        } else {
            // Retry after a short delay if ConfirmationDialog is not ready
            console.log('ConfirmationDialog not ready, retrying in 200ms...');
            setTimeout(() => {
                const retryDialog = this.getConfirmationDialog();
                if (retryDialog) {
                    retryDialog.show(
                        'Are you sure you want to revert this commit?',
                        'Revert Commit',
                        {
                            confirmText: 'Revert',
                            confirmButtonClass: 'danger-btn'
                        },
                        (confirmed) => {
                            if (confirmed) {
                                this.panel.messageHandler.sendMessage('revertCommit', { commitHash });
                            }
                        }
                    );
                } else {
                    console.error('ConfirmationDialog still not available, proceeding without confirmation');
                    this.panel.messageHandler.sendMessage('revertCommit', { commitHash });
                }
            }, 200);
        }
    }

    squashCommits() {
        this.showSquashDialog();
    }

    selectUncommittedChanges() {
        console.log('Selecting uncommitted changes');
        this.panel.selectedCommits.clear();
        this.panel.selectedCommits.add('uncommitted');
        this.panel.updateCommitSelection();
        
        // Clear diff viewer when uncommitted changes are selected
        this.panel.clearDiffViewer();
        
        // Show uncommitted changes layout in file panel
        this.showUncommittedChangesLayout();
        
        // Load both uncommitted and staged changes after a short delay to ensure layout is ready
        setTimeout(() => {
            this.loadWorkingChanges();
        }, 100);
    }

    showUncommittedChangesLayout() {
        const filesContent = document.getElementById('filesContent');
        const panelContent = filesContent?.parentElement;
        
        if (filesContent) {
            // Generate the working changes layout
            const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout({ hash: 'uncommitted' }, []);
            filesContent.innerHTML = layoutHtml;
            
            // Disable panel-content scrolling for working changes mode
            if (panelContent) {
                panelContent.classList.add('working-changes-mode');
            }
            
            // Hide the commit details footer for uncommitted changes
            const filesFooter = document.getElementById('filesFooter');
            if (filesFooter) {
                filesFooter.style.display = 'none';
            }
            
            // Hide working changes footer initially, it will be shown when there are staged changes
            const workingChangesFooter = document.getElementById('workingChangesFooter');
            if (workingChangesFooter) {
                workingChangesFooter.style.display = 'none';
            }
        }
    }

    restoreNormalLayout() {
        const filesContent = document.getElementById('filesContent');
        const panelContent = filesContent?.parentElement;
        
        if (filesContent && panelContent) {
            // Remove working changes mode to restore normal scrolling
            panelContent.classList.remove('working-changes-mode');
            
            // Show the commit details footer for regular commits
            const filesFooter = document.getElementById('filesFooter');
            if (filesFooter) {
                filesFooter.style.display = 'block';
            }
            
            // Hide working changes footer
            const workingChangesFooter = document.getElementById('workingChangesFooter');
            if (workingChangesFooter) {
                workingChangesFooter.style.display = 'none';
            }
        }
    }

    async loadWorkingChanges() {
        try {
            // Load both uncommitted and staged changes in one optimized call
            this.panel.messageHandler.sendMessage('getWorkingChanges');
        } catch (error) {
            console.error('Error loading uncommitted changes:', error);
        }
    }

    updateWorkingChangesUI() {
        // This will be called after both uncommitted and staged changes are loaded
        // The actual UI update will happen in the message handlers
    }

    commitChanges() {
        const message = prompt('Enter commit message:');
        if (message && message.trim()) {
            this.panel.messageHandler.sendMessage('commitChanges', { 
                message: message.trim() 
            });
        }
    }

    // New methods for staging and stashing
    stageAllChanges() {
        console.log('Staging all changes');
        this.panel.messageHandler.sendMessage('stageAllChanges');
    }

    stashChanges() {
        console.log('Stashing changes');
        const message = prompt('Enter stash message (optional):');
        this.panel.messageHandler.sendMessage('stashChanges', { 
            message: message ? message.trim() : undefined 
        });
    }

    unstageAllChanges() {
        console.log('Unstaging all changes - GitOperations.unstageAllChanges called');
        this.panel.messageHandler.sendMessage('unstageAllChanges');
    }

    stageFile(filePath) {
        console.log('Staging file:', filePath);
        console.log('This should remove the file from uncommitted changes and add it to staged changes');
        this.panel.messageHandler.sendMessage('stageFile', { filePath });
    }

    unstageFile(filePath) {
        console.log('Unstaging file:', filePath);
        console.log('This should remove the file from staged changes and add it to uncommitted changes');
        this.panel.messageHandler.sendMessage('unstageFile', { filePath });
    }

    revertFile(filePath) {
        console.log('=== FRONTEND REVERT FILE DEBUG ===');
        console.log('Reverting file:', filePath);
        console.log('ConfirmationDialog available:', typeof ConfirmationDialog !== 'undefined');
        
        const dialog = this.getConfirmationDialog();
        console.log('Dialog instance:', !!dialog);
        
        if (dialog) {
            console.log('Showing confirmation dialog for file:', filePath);
            dialog.show(
                `Are you sure you want to revert changes to "${filePath}"?`,
                'Revert File',
                {
                    confirmText: 'Revert',
                    confirmButtonClass: 'danger-btn'
                },
                (confirmed) => {
                    console.log('Confirmation result:', confirmed);
                    if (confirmed) {
                        console.log('Proceeding with revert for file:', filePath);
                        this.panel.messageHandler.sendMessage('revertFile', { filePath });
                    } else {
                        console.log('Revert cancelled by user');
                    }
                }
            );
        } else {
            // Try to wait for ConfirmationDialog to be available
            console.log('ConfirmationDialog not available, waiting for it to load...');
            this.waitForConfirmationDialog(filePath);
        }
        console.log('=== END FRONTEND REVERT FILE DEBUG ===');
    }

    waitForConfirmationDialog(filePath) {
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 100; // 100ms intervals
        
        const checkDialog = () => {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts} to load ConfirmationDialog...`);
            
            if (typeof ConfirmationDialog !== 'undefined') {
                console.log('ConfirmationDialog is now available!');
                this.confirmationDialog = new ConfirmationDialog();
                this.revertFile(filePath); // Retry the revert
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkDialog, checkInterval);
            } else {
                console.error('ConfirmationDialog still not available after maximum attempts');
                console.log('Using fallback confirmation dialog...');
                this.showFallbackConfirmation(filePath);
            }
        };
        
        checkDialog();
    }

    showFallbackConfirmation(filePath) {
        console.log('Creating fallback confirmation dialog for file:', filePath);
        
        // Create a simple modal dialog
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--panel-bg, #1e1e1e);
            border: 1px solid var(--panel-border, #333);
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: var(--text-color, #fff);">Revert File</h3>
            <p style="margin: 0 0 20px 0; color: var(--text-color, #ccc);">
                Are you sure you want to revert changes to "${filePath}"?
            </p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelRevert" style="
                    background: var(--button-bg, #333);
                    color: var(--button-fg, #fff);
                    border: 1px solid var(--button-border, #555);
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Cancel</button>
                <button id="confirmRevert" style="
                    background: var(--danger-bg, #d73a49);
                    color: var(--danger-fg, #fff);
                    border: 1px solid var(--danger-border, #d73a49);
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Revert</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Handle button clicks
        document.getElementById('cancelRevert').onclick = () => {
            console.log('Fallback confirmation: User cancelled revert');
            document.body.removeChild(overlay);
        };
        
        document.getElementById('confirmRevert').onclick = () => {
            console.log('Fallback confirmation: User confirmed revert for file:', filePath);
            document.body.removeChild(overlay);
            this.panel.messageHandler.sendMessage('revertFile', { filePath });
        };
        
        // Handle escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                console.log('Fallback confirmation: User cancelled revert (ESC)');
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    discardAllChanges() {
        console.log('Discarding all changes');
        const dialog = this.getConfirmationDialog();
        if (dialog) {
            dialog.show(
                'Are you sure you want to discard all uncommitted changes? This action cannot be undone.',
                'Discard All Changes',
                {
                    confirmText: 'Discard All',
                    confirmButtonClass: 'danger-btn'
                },
                (confirmed) => {
                    if (confirmed) {
                        this.panel.messageHandler.sendMessage('discardAllChanges');
                    }
                }
            );
        } else {
            // Retry after a short delay if ConfirmationDialog is not ready
            console.log('ConfirmationDialog not ready, retrying in 200ms...');
            setTimeout(() => {
                const retryDialog = this.getConfirmationDialog();
                if (retryDialog) {
                    retryDialog.show(
                        'Are you sure you want to discard all uncommitted changes? This action cannot be undone.',
                        'Discard All Changes',
                        {
                            confirmText: 'Discard All',
                            confirmButtonClass: 'danger-btn'
                        },
                        (confirmed) => {
                            if (confirmed) {
                                this.panel.messageHandler.sendMessage('discardAllChanges');
                            }
                        }
                    );
                } else {
                    console.error('ConfirmationDialog still not available, proceeding without confirmation');
                    this.panel.messageHandler.sendMessage('discardAllChanges');
                }
            }, 200);
        }
    }

    pushCommit(commitHash) {
        console.log('Pushing commit:', commitHash);
        this.panel.messageHandler.sendMessage('pushCommit', { commitHash });
    }

    // Commit popup functionality
    showCommitPopup() {
        console.log('Showing commit popup');
        this.createCommitPopup();
    }

    createCommitPopup() {
        // Remove existing popup if any
        const existingPopup = document.getElementById('commitPopup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup
        const popup = document.createElement('div');
        popup.id = 'commitPopup';
        popup.className = 'commit-popup';
        popup.innerHTML = `
            <div class="commit-popup-content">
                <div class="commit-popup-header">
                    <div class="commit-popup-title">Commit Changes</div>
                    <button class="commit-popup-close" onclick="this.closest('.commit-popup').remove()">×</button>
                </div>
                <div class="commit-popup-body">
                    <textarea class="commit-popup-message" placeholder="Enter commit message..." id="commitMessage"></textarea>
                </div>
                <div class="commit-popup-footer">
                    <button class="commit-popup-btn secondary" onclick="this.closest('.commit-popup').remove()">Cancel</button>
                    <button class="commit-popup-btn primary" onclick="window.gitOperations.commitStagedChanges()">Commit</button>
                    <button class="commit-popup-btn primary" onclick="window.gitOperations.commitAndPushStagedChanges()">Commit & Push</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('commitMessage');
            if (textarea) {
                textarea.focus();
            }
        }, 100);

        // Close on escape key
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                popup.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    commitStagedChanges() {
        const message = document.getElementById('commitMessage').value.trim();
        if (message) {
            this.panel.messageHandler.sendMessage('commitStagedChanges', { message });
            document.getElementById('commitPopup').remove();
        } else {
            alert('Please enter a commit message');
        }
    }

    commitAndPushStagedChanges() {
        const message = document.getElementById('commitMessage').value.trim();
        if (message) {
            this.panel.messageHandler.sendMessage('commitAndPushStagedChanges', { message });
            document.getElementById('commitPopup').remove();
        } else {
            alert('Please enter a commit message');
        }
    }

    selectStagedChanges() {
        console.log('Selecting staged changes');
        this.panel.selectedCommits.clear();
        this.panel.selectedCommits.add('staged');
        this.panel.updateCommitSelection();
        
        // Clear diff viewer when staged changes are selected
        this.panel.clearDiffViewer();
        
        // Show staged changes in file panel
        this.panel.messageHandler.sendMessage('getStagedChanges');
    }

    // Squash dialog functionality
    showSquashDialog() {
        const selectedCommits = Array.from(this.panel.selectedCommits);
        if (selectedCommits.length < 2) {
            alert('Please select at least 2 commits to squash');
            return;
        }

        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'squash-modal';
        modal.innerHTML = `
            <div class="squash-modal-content">
                <h3>Squash Commits</h3>
                <p>Selected commits: ${selectedCommits.length}</p>
                <textarea id="squashMessage" placeholder="Enter commit message for squashed commit..." rows="4" cols="50"></textarea>
                <div class="squash-modal-buttons">
                    <button id="squashConfirm" class="squash-button">Squash</button>
                    <button id="squashCancel" class="squash-button cancel">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('squashConfirm').addEventListener('click', () => {
            const message = document.getElementById('squashMessage').value.trim();
            if (message) {
                this.panel.messageHandler.sendMessage('squashCommits', {
                    commitHashes: selectedCommits,
                    message: message
                });
                document.body.removeChild(modal);
            } else {
                alert('Please enter a commit message');
            }
        });

        document.getElementById('squashCancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Focus on textarea
        setTimeout(() => {
            document.getElementById('squashMessage').focus();
        }, 100);
    }

    // File selection
    selectFile(fileName, commitHash, compareAgainst = 'working') {
        console.log('🚀🚀🚀 UPDATED selectFile called with:', fileName, 'commit:', commitHash, 'compare against:', compareAgainst);
        this.panel.selectedFileId = fileName;
        
        // Update file selection highlighting
        this.updateFileSelectionHighlighting(fileName);

        // Show file diff based on comparison mode
        if (compareAgainst === 'working') {
            // For working directory comparison, show diff between commit and working directory
            // But not for uncommitted changes - those should use regular showFileDiff
            if (commitHash === 'WORKING_DIRECTORY' || commitHash === 'uncommitted') {
                this.showFileDiff(fileName, null);
            } else {
                this.showFileDiffWithWorking(fileName, commitHash);
            }
        } else if (compareAgainst === 'branch') {
            // For branch comparison, show diff between commit and branch
            this.showFileDiffWithBranch(fileName, commitHash);
        } else {
            // Default: compare against previous commit
            if (commitHash && commitHash !== 'uncommitted' && commitHash !== 'WORKING_DIRECTORY' && commitHash !== 'comparison') {
                this.showFileDiff(fileName, commitHash);
            } else if (commitHash === 'uncommitted' || commitHash === 'WORKING_DIRECTORY') {
                // For uncommitted changes, show the diff
                this.showFileDiff(fileName, null);
            } else if (commitHash === 'comparison') {
                // For comparison, show the diff
                this.showFileDiff(fileName, 'comparison');
            }
        }
    }

    selectFileOnly(fileName) {
        console.log('Selecting file only (no diff):', fileName);
        this.panel.selectedFileId = fileName;
        
        // Update file selection highlighting
        this.updateFileSelectionHighlighting(fileName);
    }

    updateFileSelectionHighlighting(fileName) {
        console.log('Updating file selection highlighting for:', fileName);
        // Update file selection highlighting
        const fileItems = document.querySelectorAll('.file-tree-item.file');
        let found = false;
        
        fileItems.forEach(item => {
            item.classList.remove('selected');
            // Check if this item corresponds to the selected file using data attribute
            const filePath = item.getAttribute('data-file-path');
            if (filePath === fileName) {
                item.classList.add('selected');
                found = true;
            }
        });
        
        if (found) {
            console.log('File selected and highlighted:', fileName);
        } else {
            console.warn('File not found in file tree:', fileName);
        }
    }

    // Directory operations
    toggleDirectory(directoryName) {
        const content = document.getElementById(`${directoryName}-content`);
        if (content) {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
        }
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }

    isImageFile(fileName) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        return imageExtensions.includes(this.getFileExtension(fileName));
    }

    isTextFile(fileName) {
        const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'bat', 'yml', 'yaml'];
        return textExtensions.includes(this.getFileExtension(fileName));
    }

    // Error handling
    handleGitError(error, operation) {
        console.error(`Git operation failed (${operation}):`, error);
        // You could show a toast notification here
        alert(`Git operation failed: ${error.message || error}`);
    }

    // Progress tracking
    showProgress(message) {
        // You could implement a progress indicator here
        console.log('Progress:', message);
    }

    hideProgress() {
        // Hide progress indicator
        console.log('Progress completed');
    }
}

// Global functions for HTML onclick handlers
window.selectStagedChanges = function() {
    if (window.panelController && window.panelController.gitOperations) {
        window.panelController.gitOperations.selectStagedChanges();
    }
};

window.showStagedChangesContextMenu = function(event) {
    if (window.panelController && window.panelController.contextMenuHandler) {
        window.panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'staged', {});
    }
};

window.stageFile = function(filePath) {
    if (window.panelController && window.panelController.gitOperations) {
        window.panelController.gitOperations.stageFile(filePath);
    }
};

window.unstageFile = function(filePath) {
    if (window.panelController && window.panelController.gitOperations) {
        window.panelController.gitOperations.unstageFile(filePath);
    }
};

window.revertFile = function(filePath) {
    if (window.panelController && window.panelController.gitOperations) {
        window.panelController.gitOperations.revertFile(filePath);
    }
};

window.discardAllChanges = function() {
    if (window.panelController && window.panelController.gitOperations) {
        window.panelController.gitOperations.discardAllChanges();
    }
};

// Global function for commit context menu
window.showCommitContextMenu = function(event, commitHash, isLocal = false) {
    if (window.panelController && window.panelController.contextMenuHandler) {
        window.panelController.contextMenuHandler.showContextMenu(event.clientX, event.clientY, 'commit', { 
            commitHash: commitHash,
            isLocal: isLocal
        });
    }
};

// Make gitOperations available globally for popup callbacks
window.gitOperations = null;
