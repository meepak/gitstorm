# GitStorm Panel

A VSCode extension that provides a PhpStorm-style Git panel with three main sections for managing branches, commits, and file changes. Built with modern web technologies and a clean, intuitive interface.

## ✨ Features

### 🏗️ Three-Panel Layout
- **Branches Panel (Left)**: Shows local and remote branches in tree form with current branch highlighted
- **Commits Panel (Middle)**: Lists commits with DAG graph, search, and filtering capabilities  
- **File Changes Panel (Right)**: Shows file changes for selected commits with diff viewer

### 🌿 Branch Management
- **Smart Branch Operations**: Create, checkout, merge, and delete branches (both local and remote)
- **Visual Branch Status**: Current branch highlighted with italic, underlined blue text
- **Remote Branch Support**: Checkout remote branches as local tracking branches
- **Context Menus**: Right-click access to all branch operations
- **Branch Comparison**: Compare branches with commit differences

### 📝 Commit Management
- **Rich Commit History**: View commits with author, date, refs, and DAG visualization
- **Uncommitted Changes**: See uncommitted changes at the top of commit list with orange indicator
- **Commit Actions**: Right-click for checkout, create branch, cherry-pick, revert, and squash
- **Multi-Commit Operations**: Select multiple commits for squash operations
- **Smart Search**: Search commits by message, author, hash, and date ranges

### 📁 File Changes & Diff Viewer
- **Interactive File Tree**: Per-file list with click-to-view diff
- **Multiple Diff Views**: Side-by-side and inline diff viewing options
- **File Operations**: Copy paths, reveal in explorer, open files
- **Uncommitted Files**: View and commit working directory changes
- **Multi-Commit Aggregation**: View combined changes across multiple commits

### 🎯 Custom Context Menus
- **Intelligent Menus**: Context-aware right-click menus for branches, commits, and files
- **Quick Actions**: Copy, open, diff, checkout, merge, delete, and more
- **Commit Workflow**: Direct commit access from uncommitted changes
- **File Management**: Reveal files, copy paths, and open in editor

### 🔍 Search & Filtering
- **Real-time Search**: Search branches and commits as you type
- **Advanced Filtering**: Filter by author, date, file paths, and commit messages
- **Debounced Input**: Smooth performance with intelligent search delays
- **Persistent State**: Remembers your search and filter preferences

## 🚀 Installation

### From Source
1. Clone this repository: `git clone https://github.com/yourusername/gitstorm-panel.git`
2. Navigate to the directory: `cd gitstorm-panel`
3. Install dependencies: `npm install`
4. Compile the extension: `npm run compile`
5. Press `F5` in VSCode to run the extension in a new window

### Development Setup
```bash
git clone https://github.com/yourusername/gitstorm-panel.git
cd gitstorm-panel
npm install
npm run compile
# Open in VSCode and press F5 to launch extension host
```

## 📖 Usage

### Getting Started
1. **Open a Git Repository**: Open any Git repository in VSCode
2. **Launch GitStorm**: The panel automatically appears at the bottom of the screen
3. **Navigate**: Use the three panels to explore branches, commits, and file changes

### Key Workflows

#### 🌿 Branch Operations
- **Checkout Branch**: Click on any branch to switch to it
- **Create Branch**: Right-click → "Create Branch" from commits or branches
- **Merge Branch**: Right-click on branch → "Merge Branch"
- **Delete Branch**: Right-click → "Delete Branch" (supports remote branches)

#### 📝 Commit Management
- **View History**: Browse commits with visual DAG graph
- **Uncommitted Changes**: See working directory changes at the top with orange indicator
- **Commit Changes**: Right-click "Uncommitted Changes" → "Commit Changes"
- **Cherry Pick**: Right-click commit → "Cherry Pick"
- **Revert**: Right-click commit → "Revert"

#### 🔄 Multi-Commit Operations
- **Select Multiple**: Ctrl+click to select multiple commits
- **Squash Commits**: Right-click → "Squash Commits" (appears when multiple selected)
- **View Combined Changes**: Selected commits show aggregated file changes

#### 📁 File Operations
- **View Diffs**: Click any file to see the diff
- **Open Files**: Right-click → "Open File"
- **Copy Paths**: Right-click → "Copy Path"
- **Reveal in Explorer**: Right-click → "Reveal in Explorer"

## ⌨️ Commands

- `GitStorm: Open Panel` - Opens the GitStorm panel
- `GitStorm: Refresh` - Refreshes the Git data and reloads all panels

## 📋 Requirements

- **VSCode**: 1.74.0 or higher
- **Git**: Any modern Git installation
- **Node.js**: 16.x or higher (for development)
- **Workspace**: Must be a Git repository

## 🛠️ Development

GitStorm Panel is built with modern web technologies and follows VSCode extension best practices:

### Tech Stack
- **TypeScript**: Main language for type safety and modern JavaScript features
- **VSCode WebView API**: For the rich, interactive UI
- **Simple-Git**: Node.js Git library for all Git operations
- **CSS3**: Modern styling with VSCode theme integration
- **HTML5**: Semantic markup with accessibility in mind

### Project Structure

```
src/
├── extension.ts              # Main extension entry point and lifecycle
├── gitService.ts             # Git operations and data handling
├── gitStormPanel.ts          # Main panel WebView implementation
├── contextMenuService.ts     # Context menu handling
├── templates/
│   └── panel.html           # WebView HTML template
├── styles/
│   └── panel.css            # WebView styling with VSCode themes
└── webview/
    └── panel.js             # Frontend JavaScript for WebView
```

### Development Workflow

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Launch extension in new VSCode window
# Press F5 in VSCode
```

### Key Features Implemented

- ✅ **Custom Context Menus**: Intelligent right-click menus for all operations
- ✅ **Uncommitted Changes**: Real-time working directory change detection
- ✅ **Remote Branch Support**: Full local/remote branch management
- ✅ **Multi-Commit Operations**: Squash, cherry-pick, and revert workflows
- ✅ **Visual DAG Graph**: Commit history visualization
- ✅ **Responsive UI**: Resizable panels with persistent sizing
- ✅ **Search & Filtering**: Real-time search with debounced input
- ✅ **File Operations**: Complete file management and diff viewing

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**: Create your own fork of the project
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or fix
4. **Test Thoroughly**: Ensure all functionality works as expected
5. **Submit Pull Request**: Create a detailed PR with description

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code style
- Add appropriate error handling
- Include console logging for debugging
- Test with various Git repository states
- Ensure VSCode theme compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Inspired by PhpStorm's Git panel design
- Built with VSCode's powerful WebView API
- Uses Simple-Git for reliable Git operations
- Thanks to the VSCode extension community for best practices
