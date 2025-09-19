// File Changes Renderer - Handles file changes and tree view rendering
class FileChangesRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    generateFileChangesLayout(commit, files) {
        // Generate file tree HTML
        const fileTreeHtml = files && files.length > 0 
            ? this.generateFileTreeHtml(files, commit)
            : '<div class="empty-state"><h3>No selection</h3><p>Select a commit to view file changes, or <a href="#" onclick="showWorkingDirectoryChanges()">view working directory changes</a></p></div>';
        
        // Generate commit details
        const commitDetailsHtml = this.generateCommitDetailsHtml(commit);

        // Generate compare against header
        const compareHeaderHtml = this.generateCompareHeaderHtml();

        return `
            <div class="file-changes-container">
                ${compareHeaderHtml}
                <div class="file-changes-tree">
                    ${fileTreeHtml}
                </div>
                <div class="commit-details">
                    ${commitDetailsHtml}
                </div>
            </div>
        `;
    }

    generateFileTreeHtml(files, commit, comparison = null) {
        if (!files || files.length === 0) {
            return '<div class="empty-state"><h3>No files changed</h3></div>';
        }

        // Build a proper tree structure
        const tree = this.buildFileTree(files);
        
        // Determine the commit hash to pass
        let commitHash = '';
        if (commit) {
            commitHash = commit.hash;
            console.log('🚀🚀🚀 FileChangesRenderer: Using commit hash from commit object:', commitHash, 'commit object:', commit);
        } else if (comparison) {
            commitHash = 'comparison';
        } else {
            commitHash = 'uncommitted';
        }
        
        console.log('🚀🚀🚀 FileChangesRenderer: Final commitHash for file clicks:', commitHash);

        return this.renderTreeNodes(tree, commitHash, '');
    }

    buildFileTree(files) {
        const tree = {};
        
        files.forEach(file => {
            const path = file.file;
            const parts = path.split('/');
            const fileName = parts.pop();
            
            let current = tree;
            parts.forEach(part => {
                if (!current[part]) {
                    current[part] = { type: 'directory', name: part, children: {} };
                }
                current = current[part].children;
            });
            
            // Add file to current directory
            current[fileName] = { 
                type: 'file', 
                name: fileName, 
                ...file
            };
        });
        
        return tree;
    }

    renderTreeNodes(nodes, commitHash, prefix = '') {
        let html = '';
        const sortedKeys = Object.keys(nodes).sort();
        
        sortedKeys.forEach(key => {
            const node = nodes[key];
            
            if (node.type === 'directory') {
                const dirId = `dir-${prefix}${key}`.replace(/[^a-zA-Z0-9]/g, '-');
                const hasChildren = Object.keys(node.children).length > 0;
                
                html += `
                    <div class="file-tree-item directory" 
                         onclick="toggleDirectory('${dirId}')" 
                         oncontextmenu="event.preventDefault(); showDirectoryContextMenu(event, '${prefix}${key}')">
                        <div class="tree-toggle" id="toggle-${dirId}">${hasChildren ? '▼' : ''}</div>
                        <div class="file-tree-icon">📁</div>
                        <div class="file-tree-name">${this.escapeHtml(node.name)}</div>
                        <div class="file-tree-status"></div>
                    </div>
                `;
                
                if (hasChildren) {
                    html += `<div class="file-tree-children" id="${dirId}">`;
                    html += this.renderTreeNodes(node.children, commitHash, `${prefix}${key}/`);
                    html += `</div>`;
                }
            } else if (node.type === 'file') {
                const fileTypeIcon = this.getFileTypeIcon(node.name);
                const statusClass = this.getStatusClass(node.status);
                const changesText = this.getFileChangeStats(node);
                
                html += `
                    <div class="file-tree-item file ${statusClass}" 
                         data-file-path="${node.file}"
                         onclick="console.log('🚀🚀🚀 File click handler called for:', '${node.file}', 'commit:', '${commitHash}', 'compare against:', '${this.panel.compareAgainst}'); console.log('🚀🚀🚀 selectFile function exists:', typeof selectFile); selectFile('${node.file}', '${commitHash}', '${this.panel.compareAgainst}')" 
                         oncontextmenu="event.preventDefault(); selectFileOnly('${node.file}'); showFileContextMenu(event, '${node.file}', '${commitHash}')">
                        <div class="file-tree-icon">${fileTypeIcon}</div>
                        <div class="file-tree-name">
                            ${this.escapeHtml(node.name)}${changesText ? `<span class="file-changes"> ${changesText}</span>` : ''}
                        </div>
                    </div>
                `;
            }
        });
        
        return html;
    }

    generateCompareHeaderHtml() {
        const selectedCommits = Array.from(this.panel.selectedCommits);
        const isMultipleCommits = selectedCommits.length > 1;
        
        return `
            <div class="compare-header">
                <div class="compare-header-content">
                    <span class="compare-label">Compare Against:</span>
                    <select class="compare-select" onchange="changeCompareOption(this.value)">
                        <option value="previous" ${this.panel.compareAgainst === 'previous' ? 'selected' : ''}>Previous Commit</option>
                        <option value="branch" ${this.panel.compareAgainst === 'branch' ? 'selected' : ''}>Branch</option>
                        <option value="working" ${this.panel.compareAgainst === 'working' ? 'selected' : ''}>Working Directory</option>
                    </select>
                    ${this.panel.compareAgainst === 'branch' ? `
                        <select class="branch-select" onchange="changeCompareBranch(this.value)">
                            <option value="">Select branch...</option>
                            ${this.panel.branches ? this.panel.branches.map(branch => 
                                `<option value="${branch.name}" ${branch.name === this.panel.selectedCompareBranch ? 'selected' : ''}>${branch.name}</option>`
                            ).join('') : ''}
                        </select>
                    ` : ''}
                </div>
                <div class="compare-info">
                    ${isMultipleCommits ? 'Multiple commits selected' : selectedCommits.length === 1 ? 'Single commit selected' : 'No commits selected'}
                </div>
            </div>
        `;
    }

    generateCommitDetailsHtml(commit) {
        if (!commit) return '';
        
        return `
            <div class="commit-details-header">
                <h3>Commit Details</h3>
            </div>
            <div class="commit-details-content">
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Hash:</span>
                    <span class="commit-detail-value">${commit.hash}</span>
                </div>
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Author:</span>
                    <span class="commit-detail-value">${this.escapeHtml(commit.author)}</span>
                </div>
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Date:</span>
                    <span class="commit-detail-value">${this.formatDate(commit.date)}</span>
                </div>
                <div class="commit-detail-item">
                    <span class="commit-detail-label">Message:</span>
                    <span class="commit-detail-value">${this.escapeHtml(commit.message)}</span>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch (status) {
            case 'A': return 'added';
            case 'D': return 'deleted';
            case 'M': return 'modified';
            case 'R': return 'renamed';
            default: return 'modified';
        }
    }

    getFileChangeStats(file) {
        if (file.additions > 0 && file.deletions > 0) {
            return `+${file.additions}, -${file.deletions}`;
        } else if (file.additions > 0) {
            return `+${file.additions}`;
        } else if (file.deletions > 0) {
            return `-${file.deletions}`;
        }
        return '';
    }

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getFileTypeIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        // Programming languages
        if (['js', 'jsx', 'ts', 'tsx'].includes(extension)) return '📜';
        if (['py', 'pyc', 'pyo'].includes(extension)) return '🐍';
        if (['java', 'class', 'jar'].includes(extension)) return '☕';
        if (['cpp', 'cxx', 'cc', 'c', 'h', 'hpp'].includes(extension)) return '⚙️';
        if (['cs'].includes(extension)) return '🔷';
        if (['php'].includes(extension)) return '🐘';
        if (['rb'].includes(extension)) return '💎';
        if (['go'].includes(extension)) return '🐹';
        if (['rs'].includes(extension)) return '🦀';
        if (['swift'].includes(extension)) return '🦉';
        if (['kt'].includes(extension)) return '⚡';
        if (['scala'].includes(extension)) return '🔺';
        if (['r'].includes(extension)) return '📊';
        if (['m', 'mm'].includes(extension)) return '🍎';
        if (['pl', 'pm'].includes(extension)) return '🐪';
        if (['lua'].includes(extension)) return '🌙';
        if (['sh', 'bash', 'zsh', 'fish'].includes(extension)) return '🐚';
        if (['ps1', 'psm1'].includes(extension)) return '💙';
        if (['bat', 'cmd'].includes(extension)) return '🖥️';
        
        // Web technologies
        if (['html', 'htm'].includes(extension)) return '🌐';
        if (['css', 'scss', 'sass', 'less'].includes(extension)) return '🎨';
        if (['json'].includes(extension)) return '📋';
        if (['xml'].includes(extension)) return '📄';
        if (['yaml', 'yml'].includes(extension)) return '⚙️';
        if (['toml'].includes(extension)) return '📝';
        if (['ini', 'cfg', 'conf'].includes(extension)) return '⚙️';
        
        // Data formats
        if (['sql'].includes(extension)) return '🗄️';
        if (['csv'].includes(extension)) return '📊';
        if (['md', 'markdown'].includes(extension)) return '📖';
        if (['txt'].includes(extension)) return '📄';
        if (['log'].includes(extension)) return '📋';
        
        // Media files
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'ico', 'webp'].includes(extension)) return '🖼️';
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) return '🎬';
        if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) return '🎵';
        
        // Archives
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) return '📦';
        
        // Documents
        if (['pdf'].includes(extension)) return '📕';
        if (['doc', 'docx'].includes(extension)) return '📘';
        if (['xls', 'xlsx'].includes(extension)) return '📗';
        if (['ppt', 'pptx'].includes(extension)) return '📙';
        
        // Configuration files
        if (['gitignore', 'gitattributes'].includes(fileName.toLowerCase())) return '🔧';
        if (['dockerfile'].includes(fileName.toLowerCase())) return '🐳';
        if (['makefile'].includes(fileName.toLowerCase())) return '🔨';
        if (['readme'].includes(fileName.toLowerCase())) return '📖';
        if (['license'].includes(fileName.toLowerCase())) return '⚖️';
        
        // Default file icon
        return '📄';
    }
}
