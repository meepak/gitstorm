// File Changes Renderer - Handles file changes and tree view rendering
class FileChangesRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    generateFileChangesLayout(commit, files) {
        // Check if this is for uncommitted changes (working directory)
        if (commit && (commit.hash === 'WORKING_DIRECTORY' || commit.hash === 'uncommitted')) {
            return this.generateWorkingChangesLayout(commit, files);
        }
        
        // Generate file tree HTML for regular commits
        let fileTreeHtml;
        if (files && files.length > 0) {
            fileTreeHtml = this.generateFileTreeHtml(files, commit);
        } else if (commit) {
            // Commit is selected but no files
            fileTreeHtml = '<div class="empty-state"><h3>Selected commit have no changes to display</h3></div>';
        } else {
            // No commit selected
            fileTreeHtml = '<div class="empty-state"><h3>Select a commit to view changes</h3></div>';
        }

        return `
            <div class="file-changes-container">
                <div class="file-changes-tree">
                    ${fileTreeHtml}
                </div>
            </div>
        `;
    }

    generateWorkingChangesLayout(commit, files) {
        // This will be populated with both uncommitted and staged changes
        return `
            <div class="working-changes-container">
                <div class="working-changes-sections-container">
                    <div class="working-changes-section">
                        <div class="section-content" id="uncommittedChangesList">
                            <div class="loading">Loading uncommitted changes...</div>
                        </div>
                    </div>
                    <div class="working-changes-section">
                        <div class="section-header">
                            <h3>Staged Changes</h3>
                        </div>
                        <div class="section-content" id="stagedChangesList">
                            <div class="empty-state">No staged changes</div>
                        </div>
                    </div>
                </div>
                <div class="working-changes-footer" id="workingChangesFooter" style="display: none;">
                    <button class="commit-button" onclick="window.gitOperations.showCommitPopup()">
                        Commit Changes
                    </button>
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
            // For multiple commits, we'll use the commit hash from each individual file
            // This will be set per-file in the renderTreeNodes method
            commitHash = 'multi-commit'; // Placeholder that will be replaced per-file
            console.log('🚀🚀🚀 FileChangesRenderer: Using multi-commit mode, commit hash will be set per-file');
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
                
                // Use the file's commit hash if available, otherwise use the passed commitHash
                const fileCommitHash = node.commitHash || commitHash;
                console.log('🚀🚀🚀 FileChangesRenderer: File', node.file, 'using commit hash:', fileCommitHash, 'node.commitHash:', node.commitHash, 'fallback commitHash:', commitHash);
                console.log('🚀🚀🚀 FileChangesRenderer: File stats - additions:', node.additions, 'deletions:', node.deletions, 'status:', node.status);
                
                // Determine file status and appropriate action buttons
                const isStaged = node.status === 'staged' || node.staged;
                const isUncommitted = fileCommitHash === 'uncommitted' || fileCommitHash === 'WORKING_DIRECTORY';
                const isStagedFile = fileCommitHash === 'staged';
                
                let actionButtons = '';
                if (isUncommitted) {
                    // For uncommitted files, show stage and revert buttons
                    actionButtons = `
                        <div class="file-action-buttons">
                            <button class="file-action-btn stage-btn" onclick="event.stopPropagation(); stageFile('${node.file}')" title="Stage file">+</button>
                            <button class="file-action-btn revert-btn" onclick="event.stopPropagation(); revertFile('${node.file}')" title="Revert file">↶</button>
                        </div>
                    `;
                } else if (isStagedFile) {
                    // For staged files, show unstage button
                    actionButtons = `
                        <div class="file-action-buttons">
                            <button class="file-action-btn unstage-btn" onclick="event.stopPropagation(); unstageFile('${node.file}')" title="Unstage file">-</button>
                        </div>
                    `;
                }

                html += `
                    <div class="file-tree-item file ${statusClass}" 
                         data-file-path="${node.file}"
                         onclick="console.log('🚀🚀🚀 File click handler called for:', '${node.file}', 'commit:', '${fileCommitHash}', 'compare against:', '${this.panel.compareAgainst}'); console.log('🚀🚀🚀 selectFile function exists:', typeof selectFile); selectFile('${node.file}', '${fileCommitHash}', '${this.panel.compareAgainst}')" 
                         oncontextmenu="event.preventDefault(); selectFileOnly('${node.file}'); showFileContextMenu(event, '${node.file}', '${fileCommitHash}')">
                        <div class="file-tree-icon">${fileTypeIcon}</div>
                        <div class="file-tree-name">
                            ${this.escapeHtml(node.name)}${changesText ? `<span class="file-changes"> ${changesText}</span>` : ''}
                        </div>
                        ${actionButtons}
                    </div>
                `;
            }
        });
        
        return html;
    }

    generateCompareHeaderHtml() {
        
        // Build the single dropdown options
        let dropdownOptions = '';
        
        console.log('****FileChangesRenderer: Generating dropdown with compareAgainst:', this.panel.compareAgainst);
            
        // Current Working Directory (default)
        dropdownOptions += `<option value="working" ${this.panel.compareAgainst === 'working' ? 'selected' : ''}>Current Working Directory</option>`;   
        
        // Previous Commit
        dropdownOptions += `<option value="previous" ${this.panel.compareAgainst === 'previous' ? 'selected' : ''}>Previous Commit</option>`;
 
        
        // Non-selectable separator
        dropdownOptions += `<option value="" disabled style="font-style: italic; color: #666;">Select Branch to Compare</option>`;
        
        // Branch options
        if (this.panel.branches && this.panel.branches.length > 0) {
            this.panel.branches.forEach(branch => {
                const isSelected = this.panel.compareAgainst === 'branch' && this.panel.selectedCompareBranch === branch.name;
                dropdownOptions += `<option value="branch:${branch.name}" ${isSelected ? 'selected' : ''}>${branch.name}</option>`;
            });
        }
        
        return `
            <div class="compare-header">
                <div class="compare-header-content">
                    <img class="panel-icon" data-icon="compare" alt="Compare" title="Compare Against"/>
                    <select class="compare-select" onchange="changeCompareOptionSingle(this.value)">
                        ${dropdownOptions}
                    </select>
                </div>
            </div>
        `;
    }

    generateCommitDetailsHtml(commit) {
        const selectedCommits = Array.from(this.panel.selectedCommits);
        const isMultipleCommits = selectedCommits.length > 1;
        
        // If no commits selected, return empty
        if (selectedCommits.length === 0) return '';
        
        // If single commit but no commit parameter, return empty
        if (!isMultipleCommits && !commit) return '';
        
        // Generate pagination buttons for multiple commits
        const paginationButtons = isMultipleCommits ? `
            <div class="commit-pagination">
                <span class="commit-page-info">1/${selectedCommits.length}</span>
                <button class="commit-pagination-btn" onclick="
                    const carousel = document.querySelector('.commit-carousel');
                    const currentPage = parseInt(document.querySelector('.commit-page-info').textContent.split('/')[0]);
                    console.log('Previous button clicked, currentPage:', currentPage, 'carousel width:', carousel.style.width);
                    if (currentPage > 1) {
                        const newTransform = 'translateX(' + ((currentPage - 2) * -100) + '%)';
                        console.log('Setting transform to:', newTransform);
                        carousel.style.transform = newTransform;
                        document.querySelector('.commit-page-info').textContent = (currentPage - 1) + '/${selectedCommits.length}';
                    }
                ">‹</button>
                <button class="commit-pagination-btn" onclick="
                    const carousel = document.querySelector('.commit-carousel');
                    const currentPage = parseInt(document.querySelector('.commit-page-info').textContent.split('/')[0]);
                    console.log('Next button clicked, currentPage:', currentPage, 'carousel width:', carousel.style.width);
                    if (currentPage < ${selectedCommits.length}) {
                        const newTransform = 'translateX(' + (currentPage * -100) + '%)';
                        console.log('Setting transform to:', newTransform);
                        carousel.style.transform = newTransform;
                        document.querySelector('.commit-page-info').textContent = (currentPage + 1) + '/${selectedCommits.length}';
                    }
                ">›</button>
            </div>
        ` : '';
        
        // Generate all commit details for carousel
        const allCommits = isMultipleCommits ? selectedCommits.map(hash => 
            this.panel.commits.find(c => c.hash === hash) || { hash }
        ) : [commit];
        
        console.log('Carousel generation:', {
            isMultipleCommits,
            allCommitsLength: allCommits.length,
            carouselWidth: `${allCommits.length * 100}%`,
            selectedCommits: selectedCommits
        });
        
        const commitSlides = allCommits.map(commitData => 
            `
                <div class="commit-slide">
                    <div class="commit-detail-item">
                        <span class="commit-detail-label">Hash:</span>
                        <span class="commit-detail-value">${commitData.hash}</span>
                    </div>
                    <div class="commit-detail-item">
                        <span class="commit-detail-label">Author:</span>
                        <span class="commit-detail-value">${this.escapeHtml(commitData.author || '')}</span>
                    </div>
                    <div class="commit-detail-item">
                        <span class="commit-detail-label">Date:</span>
                        <span class="commit-detail-value">${this.formatDate(commitData.date)}</span>
                    </div>
                    <div class="commit-detail-item">
                        <span class="commit-detail-label">Message:</span>
                        <span class="commit-detail-value message-value has-tooltip" title="${this.escapeHtml(commitData.message)}">
                            ${commitData.message}
                        </span>
                    </div>
                </div>
            `
        ).join('');
        
        return `
            <div class="panel-footer-header">
                <h3>Commit Details</h3>
                ${paginationButtons}
            </div>
            <div class="panel-footer-content">
                <div class="commit-carousel" style="width: ${allCommits.length * 100}%; transform: translateX(0%)">
                    ${commitSlides}
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
