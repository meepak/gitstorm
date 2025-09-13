# GitStorm Panel

A VSCode extension that provides a PhpStorm-style Git panel with three main sections for managing branches, commits, and file changes.

## Features

### Three-Panel Layout
- **Branches Panel (Left)**: Shows local and remote branches in tree form with current branch highlighted
- **Commits Panel (Middle)**: Lists commits with DAG graph, search, and filtering capabilities
- **File Changes Panel (Right)**: Shows file changes for selected commits with diff viewer

### Branch Management
- Create, checkout, rename, and delete branches
- Track upstream, set remote, fetch/prune
- Compare branches with commit list and file diff
- Push/pull, reset, and protect branches
- Context menus for all branch operations

### Commit Management
- View commit history with author, date, and refs
- Right-click actions: checkout, create branch/tag, cherry-pick, revert, reset
- Multi-select commits for squash operations
- Search and filter commits by branch, user, date, and paths
- DAG graph visualization on the left margin

### File Changes & Diff Viewer
- Per-file list with click-to-view diff
- Side-by-side and inline diff viewing
- Navigate between hunks, stage/discard hunks/lines
- Copy patch and open in editor
- Support for both single commit and multi-commit aggregated views

### Squash Workflow
- Select multiple commits to view aggregated file changes
- Squash commits with custom commit message
- Interactive rebase with conflict resolution
- Backup branch creation before squash operations

### Search & Filtering
- Search branches by name
- Search commits by message, author, or hash
- Filter commits by date, author, and file paths
- Real-time filtering as you type

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to run the extension in a new VSCode window

## Usage

1. Open a Git repository in VSCode
2. The GitStorm panel will automatically appear at the bottom of the screen
3. Use the three panels to navigate branches, commits, and file changes
4. Right-click on branches or commits for context menu actions
5. Select multiple commits to use the squash functionality

## Commands

- `GitStorm: Open Panel` - Opens the GitStorm panel
- `GitStorm: Refresh` - Refreshes the Git data

## Requirements

- VSCode 1.74.0 or higher
- Git repository in workspace
- Node.js for development

## Development

The extension is built with TypeScript and uses the VSCode WebView API for the UI. The Git operations are handled through the `simple-git` library.

### Project Structure

```
src/
├── extension.ts          # Main extension entry point
├── gitService.ts         # Git operations and data handling
├── gitStormPanel.ts      # Main panel WebView implementation
└── contextMenuService.ts # Context menu handling
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
