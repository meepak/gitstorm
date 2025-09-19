# Changelog

All notable changes to GitStorm Panel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README.md with detailed feature descriptions
- CONTRIBUTING.md for contributor guidelines
- MIT License (LICENSE.md)
- Enhanced .gitignore with comprehensive patterns

## [0.1.0] - 2024-01-XX

### Added
- Initial release of GitStorm Panel
- Three-panel layout (Branches, Commits, File Changes)
- Custom context menus for all operations
- Uncommitted changes detection and management
- Remote branch support (checkout, delete)
- Multi-commit operations (squash, cherry-pick, revert)
- Visual DAG graph for commit history
- Real-time search and filtering
- Resizable panels with persistent sizing
- File diff viewer with multiple view modes
- Branch comparison functionality
- Complete Git workflow support

### Features
- **Branch Management**: Create, checkout, merge, delete branches
- **Commit Operations**: Cherry-pick, revert, squash, create branches from commits
- **File Operations**: View diffs, open files, copy paths, reveal in explorer
- **Uncommitted Changes**: View and commit working directory changes
- **Context Menus**: Intelligent right-click menus for all operations
- **Search & Filter**: Real-time search with debounced input
- **Visual Indicators**: Current branch highlighting, uncommitted changes indicator

### Technical
- Built with TypeScript and VSCode WebView API
- Uses Simple-Git for Git operations
- Responsive UI with VSCode theme integration
- Comprehensive error handling and logging
- Modern CSS with custom properties for theming

## [0.0.1] - 2024-01-XX

### Added
- Initial project setup
- Basic extension structure
- TypeScript configuration
- VSCode extension manifest
