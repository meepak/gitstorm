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
                        error: message.error, 
                        hasUncommittedChanges: message.hasUncommittedChanges 
                    });
                    this.panel.updateContent(message.branches, message.commits, message.error, message.hasUncommittedChanges);
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
                    this.handleError(message.error);
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
        
        const filesContent = document.getElementById('filesContent');
        console.log('filesContent element found:', !!filesContent);
        
        if (filesContent) {
            // Always use the layout method to ensure header and footer are shown
            const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout(commit, files);
            filesContent.innerHTML = layoutHtml;
            console.log('Files content updated successfully');
        } else {
            console.error('filesContent element not found!');
        }
    }

    handleFileDiff(file, diff) {
        const diffContent = document.getElementById('diffContent');
        if (diffContent) {
            if (diff) {
                const formattedDiff = this.formatDiff(diff, file);
                diffContent.innerHTML = formattedDiff;
            } else {
                diffContent.innerHTML = '<div class="empty-state"><h3>No diff available for this file</h3></div>';
            }
        }
    }

    formatDiff(diff, fileName) {
        const lines = diff.split('\n');
        let formattedHtml = `<div class="diff-header">📄 ${this.escapeHtml(fileName)}</div>`;
        
        lines.forEach(line => {
            if (line.startsWith('+++') || line.startsWith('---')) {
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
            const filesContent = document.getElementById('filesContent');
            if (filesContent) {
                // Use layout method to ensure header and footer are shown
                const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout(null, comparison.files);
                filesContent.innerHTML = layoutHtml;
            }
        }
    }

    handleMultiCommitFiles(files) {
        // Store current files for search functionality
        this.panel.currentFiles = files || [];
        this.panel.selectedCommit = null; // Multiple commits selected
        
        const filesContent = document.getElementById('filesContent');
        if (filesContent && files) {
            // Use layout method to ensure header and footer are shown
            const layoutHtml = this.panel.uiRenderer.generateFileChangesLayout(null, files);
            filesContent.innerHTML = layoutHtml;
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

    // Method to send messages to extension
    sendMessage(command, data = {}) {
        this.panel.vscode.postMessage({
            command: command,
            ...data
        });
    }
}
