# GitStorm Webview Frontend

This directory contains the refactored frontend code for the GitStorm Panel extension, organized into modular components for better maintainability and readability.

## 📁 Directory Structure

```
src/webview/
├── core/
│   └── PanelController.js          # Main controller class
├── handlers/
│   ├── MessageHandler.js           # VSCode extension communication
│   └── ContextMenuHandler.js       # Context menu functionality
├── renderers/
│   └── UIRenderer.js               # HTML generation and UI updates
├── managers/
│   └── SearchManager.js            # Search and filtering logic
├── operations/
│   └── GitOperations.js            # Git and file operations
├── globals.js                      # Global functions for HTML handlers
└── README.md                       # This file
```

## 🏗️ Architecture

### Core Components

#### PanelController (`core/PanelController.js`)
- **Purpose**: Main controller that orchestrates all components
- **Responsibilities**:
  - Initialize and coordinate sub-components
  - Manage panel state and data
  - Handle panel resizing and layout
  - Provide public API for other components

#### MessageHandler (`handlers/MessageHandler.js`)
- **Purpose**: Handles all communication with the VSCode extension
- **Responsibilities**:
  - Process incoming messages from extension
  - Handle different message types (updateContent, commitDetails, etc.)
  - Send messages back to extension
  - Error handling for communication

#### ContextMenuHandler (`handlers/ContextMenuHandler.js`)
- **Purpose**: Manages custom context menus
- **Responsibilities**:
  - Show/hide context menus based on context
  - Handle context menu actions
  - Manage menu item visibility
  - Position menus correctly

#### UIRenderer (`renderers/UIRenderer.js`)
- **Purpose**: Generates HTML and updates UI elements
- **Responsibilities**:
  - Generate HTML for branches, commits, and files
  - Handle UI updates and content refreshing
  - Manage user filter population
  - Format dates and escape HTML

#### SearchManager (`managers/SearchManager.js`)
- **Purpose**: Handles search and filtering functionality
- **Responsibilities**:
  - Manage search input events
  - Debounce search operations
  - Filter branches and commits
  - Handle compare functionality

#### GitOperations (`operations/GitOperations.js`)
- **Purpose**: Handles Git and file operations
- **Responsibilities**:
  - File operations (copy, open, diff, reveal)
  - Branch operations (checkout, merge, delete)
  - Commit operations (cherry-pick, revert, squash)
  - Uncommitted changes management

#### Globals (`globals.js`)
- **Purpose**: Provides global functions accessible from HTML
- **Responsibilities**:
  - Bridge between HTML onclick handlers and components
  - Initialize the panel controller
  - Provide debugging access

## 🔄 Data Flow

1. **Extension → Frontend**: Messages sent via `MessageHandler`
2. **Frontend → Extension**: Messages sent via `panel.vscode.postMessage()`
3. **User Interactions**: HTML events → Global functions → Component methods
4. **UI Updates**: Component methods → `UIRenderer` → DOM updates

## 📋 Loading Order

JavaScript files are loaded in this specific order to ensure dependencies are available:

1. `core/PanelController.js` - Main controller
2. `handlers/MessageHandler.js` - Message handling
3. `handlers/ContextMenuHandler.js` - Context menus
4. `renderers/UIRenderer.js` - UI rendering
5. `managers/SearchManager.js` - Search functionality
6. `operations/GitOperations.js` - Git operations
7. `globals.js` - Global functions and initialization

## 🛠️ Development

### Adding New Features

1. **New Git Operation**: Add method to `GitOperations` class
2. **New UI Component**: Add method to `UIRenderer` class
3. **New Search Feature**: Add method to `SearchManager` class
4. **New Message Type**: Add handler to `MessageHandler` class

### Debugging

- Use `window.panelController` to access the main controller
- All global functions are available on the window object
- Console logging is included throughout for debugging

### Best Practices

- Keep components focused on single responsibilities
- Use dependency injection (pass panelController to components)
- Maintain consistent error handling
- Add console logging for debugging
- Follow the established naming conventions

## 🔧 Migration from Original

The original `panel.js` file (1844 lines) has been refactored into:
- 7 focused, modular files
- Clear separation of concerns
- Improved maintainability
- Better debugging capabilities
- Easier testing and development

All original functionality has been preserved while improving code organization and readability.
