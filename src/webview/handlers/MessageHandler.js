// Message Handler - Handles all VSCode extension communication
class MessageHandler {
    constructor(panelController) {
        this.panel = panelController;
        this.setupMessageListener();
    }

    setupMessageListener() {
        // Message listener for content updates
        window.addEventListener('message', (event) => {
            const message = event.data;
            console.log('WebView received message:', message);
            console.log('Message command:', message.command);
            
            switch (message.command) {
                case 'updateContent':
                    console.log('Processing updateContent:', { 
                        branches: message.branches?.length, 
                        commits: message.commits?.length,
                        stashes: message.stashes?.length, 
                        error: message.error, 
                        hasUncommittedChanges: message.hasUncommittedChanges,
                        hasStagedChanges: message.hasStagedChanges
                    });
                    // Hide loading states when data arrives
                    this.panel.hidePanelLoadingStates();
                    // Stop refresh animation when data arrives
                    this.panel.stopRefreshAnimation();
                    this.panel.updateContent(message.branches, message.commits, message.stashes, message.error, message.hasUncommittedChanges, message.hasStagedChanges);
                    break;
                    
                case 'updatePanelSizes':
                    this.panel.panelSizes = message.sizes;
                    this.panel.restorePanelSizes();
                    break;
                    
                case 'commitDetails':
                    console.log('Frontend: Received commitDetails message');
                    console.log('Frontend: Commit:', message.commit);
                    console.log('Frontend: Files:', message.files);
                    console.log('Frontend: Files length:', message.files ? message.files.length : 'undefined');
                    this.handleCommitDetails(message.commit, message.files);
                    break;
                    
                case 'multiCommitFiles':
                    console.log('Received multi-commit files:', message.files);
                    this.handleMultiCommitFiles(message.files);
                    break;
                    
                case 'fileDiff':
                    console.log('Frontend: Received fileDiff message');
                    console.log('Frontend: File:', message.file);
                    console.log('Frontend: Diff:', message.diff);
                    this.handleFileDiff(message.file, message.diff);
                    break;
                    
                case 'updateFileDiff':
                    console.log('Frontend: Received updateFileDiff message');
                    console.log('Frontend: File:', message.file);
                    console.log('Frontend: Diff:', message.diff);
                    this.handleFileDiff(message.file, message.diff);
                    break;
                    
                case 'branchComparison':
                    console.log('Frontend: Received branchComparison message');
                    console.log('Frontend: Comparison data:', message.comparison);
                    this.handleBranchComparison(message.comparison);
                    break;
                    
                case 'commitsWithCompare':
                    console.log('Frontend: Received commitsWithCompare message');
                    console.log('Frontend: Commits:', message.commits?.length);
                    this.handleCommitsWithCompare(message.commits);
                    break;
                    
                case 'updateCommitsWithCompare':
                    console.log('Received commits with compare:', message.commits?.length, 'for branch:', message.branch, 'excluding:', message.compareBranch);
                    this.handleUpdateCommitsWithCompare(message.commits, message.branch, message.compareBranch, message.error);
                    break;
                    
                case 'error':
                    console.error('Frontend: Received error message:', message.error);
                    // Stop refresh animation on error
                    this.panel.stopRefreshAnimation();
                    // Reset all loading states on error
                    this.resetAllLoadingStates();
                    this.handleError(message.error);
                    break;

                case 'updateUncommittedChanges':
                    this.updateUncommittedChangesSection(message.files);
                    break;

                case 'updateStagedChanges':
                    this.updateStagedChangesSection(message.files);
                    break;

                case 'success':
                    this.handleSuccess(message.message);
                    break;

                case 'stashDetails':
                    this.handleStashDetails(message.stashName, message.files);
                    break;
                    
                default:
                    console.log('Unknown message command:', message.command);
            }
        });
    }

    handleCommitDetails(commit, files) {
        console.log('MessageHandler.handleCommitDetails called with:', { 
            commit: commit?.hash, 
            files: files?.length,
            filesData: files
        });
        
        // Store current files for search functionality
        this.panel.currentFiles = files || [];
        this.panel.selectedCommit = commit;
        
        // Only restore normal layout for regular commits, not for uncommitted changes
        if (this.panel.gitOperations && commit && commit.hash !== 'uncommitted' && commit.hash !== 'WORKING_DIRECTORY') {
            this.panel.gitOperations.restoreNormalLayout();
        }
        
        const filesContent = document.getElementById('filesContent');
        console.log('filesContent element found:', !!filesContent);
        
        if (filesContent) {
            // Generate the file changes layout
            const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout(commit, files);
            filesContent.innerHTML = layoutHtml;
            
            // Handle footer based on commit type
            const filesFooter = document.getElementById('filesFooter');
            if (filesFooter) {
                if (commit && commit.hash !== 'uncommitted' && commit.hash !== 'WORKING_DIRECTORY') {
                    // Show commit details footer for regular commits
                    filesFooter.innerHTML = this.panel.uiRenderer.generateCommitDetailsHtml(commit);
                    filesFooter.style.display = 'block';
                } else {
                    // Hide commit details footer for uncommitted changes
                    filesFooter.style.display = 'none';
                }
            }
            console.log('Files content updated successfully');
        } else {
            console.error('filesContent element not found!');
        }
    }

    handleFileDiff(file, diff) {
        const diffContent = document.getElementById('diffContent');
        if (diffContent) {
            if (diff) {
                // Store current diff file information for context menu
                this.panel.currentDiffFile = file;
                this.panel.currentDiffCommitHash = this.panel.selectedCommit || 'uncommitted';
                
                const formattedDiff = this.formatDiff(diff, file);
                diffContent.innerHTML = formattedDiff;
            } else {
                diffContent.innerHTML = '<div class="empty-state"><h3>No diff available for this file</h3></div>';
            }
        }
    }

    formatDiff(diff, fileName) {
        const lines = diff.split('\n');
        const commitHash = this.panel.currentDiffCommitHash || 'uncommitted';
        
        let formattedHtml = `
            <div class="diff-header">
                <div class="diff-header-content">
                    <span class="diff-file-name">📄 ${this.escapeHtml(fileName)}</span>
                    <div class="diff-header-actions"></div>
                        <button class="diff-menu-btn" onclick="showDiffFileContextMenu(event, '${this.escapeHtml(fileName)}', '${commitHash}')" title="File Actions">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 57.6 40.659"><path fill-rule="evenodd" d="M57.6 33.882v6.777H0v-6.777zm0-16.94v6.776H0V16.94ZM57.6 0v6.776H0V0Z" stroke-width="0.03" fill="currentColor"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        lines.forEach(line => {
            // Git diff headers (these should not be colored as additions/deletions)
            if (line.startsWith('+++') || line.startsWith('---') || 
                line.startsWith('diff --git') || line.startsWith('index ') ||
                line.startsWith('new file') || line.startsWith('deleted file') ||
                line.startsWith('similarity index') || line.startsWith('rename')) {
                formattedHtml += `<div class="diff-header">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('@@')) {
                formattedHtml += `<div class="diff-context">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('+')) {
                formattedHtml += `<div class="diff-added">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('-')) {
                formattedHtml += `<div class="diff-removed">${this.escapeHtml(line)}</div>`;
            } else {
                formattedHtml += `<div class="diff-context">${this.escapeHtml(line)}</div>`;
            }
        });
        
        return formattedHtml;
    }

    handleBranchComparison(comparison) {
        if (comparison && comparison.files) {
            // Restore normal layout for branch comparison (show commit details footer, enable scrolling)
            if (this.panel.gitOperations) {
                this.panel.gitOperations.restoreNormalLayout();
            }
            
            const filesContent = document.getElementById('filesContent');
            if (filesContent) {
                // Generate the file changes layout
                const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout(null, comparison.files);
                filesContent.innerHTML = layoutHtml;
                
                // Update the footer separately
                const filesFooter = document.getElementById('filesFooter');
                if (filesFooter) {
                    filesFooter.innerHTML = this.panel.uiRenderer.generateCommitDetailsHtml(null);
                }
            }
        }
    }

    handleMultiCommitFiles(files) {
        // Store current files for search functionality
        this.panel.currentFiles = files || [];
        this.panel.selectedCommit = null; // Multiple commits selected
        
        // Restore normal layout for multi-commit files (show commit details footer, enable scrolling)
        if (this.panel.gitOperations) {
            this.panel.gitOperations.restoreNormalLayout();
        }
        
        const filesContent = document.getElementById('filesContent');
        if (filesContent && files) {
            // Generate the file changes layout
            const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout(null, files);
            filesContent.innerHTML = layoutHtml;
            
            // Update the footer separately
            const filesFooter = document.getElementById('filesFooter');
            if (filesFooter) {
                filesFooter.innerHTML = this.panel.uiRenderer.generateCommitDetailsHtml(null);
            }
        }
    }

    handleCommitsWithCompare(commits) {
        console.log('handleCommitsWithCompare called with:', commits?.length, 'commits');
        if (commits) {
            this.panel.commits = commits;
            const commitsContent = document.getElementById('commitsContent');
            if (commitsContent) {
                // Apply current filters to the compared commits
                const filteredCommits = this.filterCommits(commits, this.panel.commitsSearchTerm, this.panel.selectedUser);
                commitsContent.innerHTML = this.panel.uiRenderer.generateCommitsHtml(filteredCommits, this.panel.commitsSearchTerm, this.panel.selectedUser);
                setTimeout(() => this.panel.updateCommitSelection(), 10);
            }
        } else {
            console.log('No commits received for comparison');
            const commitsContent = document.getElementById('commitsContent');
            if (commitsContent) {
                commitsContent.innerHTML = '<div class="empty-state"><h3>No commits found</h3><p>No commits in this branch that are not in the comparison branch</p></div>';
            }
        }
    }
    
    filterCommits(commits, searchTerm, selectedUser) {
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

    handleUpdateCommitsWithCompare(commits, branch, compareBranch, error) {
        if (error) {
            console.error('Error loading commits with compare:', error);
            const commitsContent = document.getElementById('commitsContent');
            if (commitsContent) {
                commitsContent.innerHTML = `<div class="empty-state"><h3>Error loading commits</h3><p>${error}</p></div>`;
            }
            return;
        }

        if (commits) {
            this.panel.commits = commits;
            // Don't change the current branch - we want to keep the original branch selected
            // The commits shown are just compared against the target branch
            const commitsContent = document.getElementById('commitsContent');
            if (commitsContent) {
                commitsContent.innerHTML = this.panel.uiRenderer.generateCommitsHtml(commits, this.panel.commitsSearchTerm, this.panel.selectedUser);
                setTimeout(() => this.panel.updateCommitSelection(), 10);
            }
            
            // Ensure the original branch remains highlighted as selected
            this.panel.updateBranchHighlighting(this.panel.currentBranch);
        }
    }

    handleError(error) {
        // Show error in UI
        const errorMessage = error || 'An unknown error occurred';
        console.error('Error in GitStorm panel:', errorMessage);
        
        // You could show a toast notification here
        // For now, just log to console
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateUncommittedChangesSection(files) {
        console.log('updateUncommittedChangesSection called with files:', files);
        console.log('Uncommitted files count:', files ? files.length : 0);
        if (files && files.length > 0) {
            console.log('Uncommitted file names:', files.map(f => f.file));
        }
        
        // Reset all loading states when files are updated
        this.resetAllLoadingStates();
        
        const uncommittedList = document.getElementById('uncommittedChangesList');
        if (uncommittedList) {
            if (files && files.length > 0) {
                console.log('Rendering uncommitted files:', files.length);
                const fileTreeHtml = this.panel.uiRenderer.fileChangesRenderer.generateFileTreeHtml(files, { hash: 'uncommitted' });
                uncommittedList.innerHTML = fileTreeHtml;
            } else {
                uncommittedList.innerHTML = '<div class="empty-state">No uncommitted changes</div>';
            }
        } else {
            console.log('uncommittedChangesList element not found, layout may not be ready yet');
        }
    }

    updateStagedChangesSection(files) {
        console.log('updateStagedChangesSection called with files:', files);
        console.log('Staged files count:', files ? files.length : 0);
        if (files && files.length > 0) {
            console.log('Staged file names:', files.map(f => f.file));
        }
        
        // Reset all loading states when files are updated
        this.resetAllLoadingStates();
        
        const stagedList = document.getElementById('stagedChangesList');
        const commitFooter = document.getElementById('workingChangesFooter');
        
        if (stagedList) {
            if (files && files.length > 0) {
                const fileTreeHtml = this.panel.uiRenderer.fileChangesRenderer.generateFileTreeHtml(files, { hash: 'staged' });
                stagedList.innerHTML = fileTreeHtml;
                
                // Show commit button when there are staged changes
                if (commitFooter) {
                    commitFooter.style.display = 'block';
                    commitFooter.style.visibility = 'visible';
                }
            } else {
                stagedList.innerHTML = '<div class="empty-state">No staged changes</div>';
                
                // Hide commit button when no staged changes
                if (commitFooter) {
                    commitFooter.style.display = 'none';
                    commitFooter.style.visibility = 'hidden';
                }
            }
        } else {
            console.log('stagedChangesList element not found, layout may not be ready yet');
        }
    }

    handleSuccess(message) {
        console.log('Success message received:', message);
        // Reset all loading states on success
        this.resetAllLoadingStates();
    }

    handleStashDetails(stashName, files) {
        console.log('handleStashDetails called with:', { stashName, files: files?.length });
        
        // Store current files for search functionality
        this.panel.currentFiles = files || [];
        this.panel.selectedCommit = null;
        
        // Restore normal layout
        if (this.panel.gitOperations) {
            this.panel.gitOperations.restoreNormalLayout();
        }
        
        const filesContent = document.getElementById('filesContent');
        if (filesContent) {
            // Generate the file changes layout
            const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout({ hash: stashName, message: `Stash: ${stashName}` }, files);
            filesContent.innerHTML = layoutHtml;
            
            // Update the footer
            const filesFooter = document.getElementById('filesFooter');
            if (filesFooter) {
                filesFooter.innerHTML = this.panel.uiRenderer.generateCommitDetailsHtml({ hash: stashName, message: `Stash: ${stashName}` });
                filesFooter.style.display = 'block';
            }
        }
    }

    resetAllLoadingStates() {
        // Reset all section action buttons
        const sectionButtons = document.querySelectorAll('.section-action-btn');
        sectionButtons.forEach(button => {
            button.classList.remove('loading');
            button.disabled = false;
        });
        
        // Reset all file action buttons
        const fileButtons = document.querySelectorAll('.file-action-btn');
        fileButtons.forEach(button => {
            button.classList.remove('loading');
            button.disabled = false;
        });
    }

    // Method to send messages to extension
    sendMessage(command, data = {}) {
        this.panel.vscode.postMessage({
            command: command,
            ...data
        });
    }
}
