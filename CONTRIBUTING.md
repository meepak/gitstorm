# Contributing to GitStorm Panel

Thank you for your interest in contributing to GitStorm Panel! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- VSCode 1.74.0 or higher
- Git
- Basic knowledge of TypeScript and VSCode extension development

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/gitstorm-panel.git
   cd gitstorm-panel
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run compile
   ```

4. **Run in Development Mode**
   - Open the project in VSCode
   - Press `F5` to launch a new Extension Development Host window
   - Open a Git repository in the new window to test the extension

## 🛠️ Development Workflow

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain consistent indentation (2 spaces)

### Project Structure
```
src/
├── extension.ts              # Main entry point
├── gitService.ts             # Git operations
├── gitStormPanel.ts          # Main panel logic
├── contextMenuService.ts     # Context menu handling
├── templates/                # HTML templates
├── styles/                   # CSS styling
└── webview/                  # Frontend JavaScript
```

### Key Components

#### GitService (`gitService.ts`)
- Handles all Git operations using Simple-Git
- Provides typed interfaces for Git data
- Includes error handling and logging

#### GitStormPanel (`gitStormPanel.ts`)
- Main WebView panel implementation
- Message handling between extension and webview
- Manages panel lifecycle and state

#### WebView Frontend (`webview/panel.js`)
- Interactive UI logic
- Context menu handling
- Search and filtering functionality

## 🐛 Bug Reports

When reporting bugs, please include:

1. **VSCode Version**: Exact version number
2. **Extension Version**: Current version
3. **Operating System**: OS and version
4. **Steps to Reproduce**: Clear, numbered steps
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **Console Output**: Any error messages from Developer Tools

### How to Get Console Output
1. Open Developer Tools: `Help > Toggle Developer Tools`
2. Go to Console tab
3. Look for error messages or logs

## ✨ Feature Requests

We welcome feature suggestions! Please:

1. Check existing issues to avoid duplicates
2. Provide a clear description of the feature
3. Explain the use case and benefits
4. Consider implementation complexity

## 🔧 Pull Request Process

### Before Submitting
1. **Test Thoroughly**: Ensure your changes work as expected
2. **Check Linting**: Run `npm run compile` to check for TypeScript errors
3. **Update Documentation**: Update README if needed
4. **Add Tests**: Consider adding tests for new functionality

### PR Guidelines
1. **Clear Title**: Descriptive title explaining the change
2. **Detailed Description**: Explain what, why, and how
3. **Small Changes**: Keep PRs focused and reasonably sized
4. **Screenshots**: Include screenshots for UI changes

### Review Process
- All PRs require review before merging
- Address feedback promptly
- Keep discussions constructive and focused

## 🏗️ Architecture Guidelines

### Message Passing
- Use typed message interfaces
- Handle errors gracefully
- Include proper logging

### UI Components
- Follow VSCode design guidelines
- Use CSS custom properties for theming
- Ensure accessibility compliance

### Git Operations
- Always handle Git errors
- Provide meaningful error messages
- Log operations for debugging

## 📝 Code Examples

### Adding a New Git Operation

```typescript
// In gitService.ts
async newGitOperation(param: string): Promise<boolean> {
    try {
        await this.git.operation(param);
        return true;
    } catch (error) {
        console.error('Error in newGitOperation:', error);
        return false;
    }
}
```

### Adding a Context Menu Item

```html
<!-- In panel.html -->
<div class="context-menu-item" data-action="new-action">
    <span class="context-menu-icon">🔧</span>
    <span class="context-menu-text">New Action</span>
</div>
```

```css
/* In panel.css */
.context-menu-item[data-action="new-action"] {
    display: none; /* Shown based on context */
}
```

```javascript
// In panel.js
case 'new-action':
    this.handleNewAction();
    break;
```

## 🤝 Community Guidelines

- Be respectful and constructive
- Help others learn and grow
- Share knowledge and best practices
- Follow the Code of Conduct

## 📞 Getting Help

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check README.md for usage instructions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to GitStorm Panel! 🎉
