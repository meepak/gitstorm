// Git Operations - Handles all Git-related operations and file operations
class GitOperations {
    constructor(panelController) {
        this.panel = panelController;
        this.confirmationDialog = null; // Initialize lazily
    }

    // Lazy initialization of confirmation dialog
    getConfirmationDialog() {
        if (!this.confirmationDialog && typeof ConfirmationDialog !== 'undefined') {
            this.confirmationDialog = new ConfirmationDialog();
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
        this.panel.messageHandler.sendMessage('openFile', { fileName });
    }

    showFileDiff(fileName, commitHash) {
        this.panel.messageHandler.sendMessage('showFileDiff', { 
            filePath: fileName, 
            commitHash 
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
        this.panel.messageHandler.sendMessage('revealFileInExplorer', { filePath: fileName });
    }

    revealDirectoryInExplorer(directoryName) {
        this.panel.messageHandler.sendMessage('revealDirectoryInExplorer', { directoryName });
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
            console.error('ConfirmationDialog not available');
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
            console.error('ConfirmationDialog not available');
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
        
        // Show uncommitted changes in file panel
        this.panel.messageHandler.sendMessage('getUncommittedChanges');
    }

    commitChanges() {
        const message = prompt('Enter commit message:');
        if (message && message.trim()) {
            this.panel.messageHandler.sendMessage('commitChanges', { 
                message: message.trim() 
            });
        }
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
    selectFile(fileName, commitHash) {
        console.log('Selecting file:', fileName, 'for commit:', commitHash);
        this.panel.selectedFileId = fileName;
        
        // Update file selection highlighting
        this.updateFileSelectionHighlighting(fileName);

        // Show file diff
        if (commitHash && commitHash !== 'uncommitted' && commitHash !== 'comparison') {
            this.showFileDiff(fileName, commitHash);
        } else if (commitHash === 'uncommitted') {
            // For uncommitted changes, show the diff
            this.showFileDiff(fileName, null);
        } else if (commitHash === 'comparison') {
            // For comparison, show the diff
            this.showFileDiff(fileName, 'comparison');
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
        fileItems.forEach(item => {
            item.classList.remove('selected');
            // Check if this item corresponds to the selected file using data attribute
            const filePath = item.getAttribute('data-file-path');
            console.log('Comparing:', filePath, 'with', fileName);
            if (filePath === fileName) {
                item.classList.add('selected');
                console.log('File selected and highlighted:', fileName);
            }
        });
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
