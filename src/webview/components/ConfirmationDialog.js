// ConfirmationDialog Component - Reusable confirmation dialog for webview
class ConfirmationDialog {
    constructor() {
        this.overlay = null;
        this.callback = null;
    }

    /**
     * Show a confirmation dialog
     * @param {string} message - The message to display
     * @param {string} title - Optional title for the dialog
     * @param {Object} options - Optional configuration
     * @param {string} options.confirmText - Text for confirm button (default: "Confirm")
     * @param {string} options.cancelText - Text for cancel button (default: "Cancel")
     * @param {string} options.confirmButtonClass - CSS class for confirm button
     * @param {string} options.cancelButtonClass - CSS class for cancel button
     * @param {Function} callback - Callback function called with boolean result
     */
    show(message, title = null, options = {}, callback = null) {
        // If already showing a dialog, close it first
        if (this.overlay) {
            this.hide();
        }

        // Set up callback
        this.callback = callback;

        // Default options
        const config = {
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            confirmButtonClass: 'confirm-btn',
            cancelButtonClass: 'cancel-btn',
            ...options
        };

        // Create modal overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'confirmation-dialog-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        `;

        // Create dialog box
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.style.cssText = `
            background-color: var(--vscode-editor-background, #1e1e1e);
            border: 1px solid var(--vscode-panel-border, #3c3c3c);
            border-radius: 6px;
            padding: 0;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
            transition: transform 0.2s ease-in-out;
        `;

        // Create header if title is provided
        if (title) {
            const header = document.createElement('div');
            header.className = 'confirmation-dialog-header';
            header.style.cssText = `
                padding: 16px 20px 12px 20px;
                border-bottom: 1px solid var(--vscode-panel-border, #3c3c3c);
            `;
            
            const titleEl = document.createElement('h3');
            titleEl.style.cssText = `
                margin: 0;
                color: var(--vscode-editor-foreground, #cccccc);
                font-size: 16px;
                font-weight: 600;
            `;
            titleEl.textContent = title;
            
            header.appendChild(titleEl);
            dialog.appendChild(header);
        }

        // Create body
        const body = document.createElement('div');
        body.className = 'confirmation-dialog-body';
        body.style.cssText = `
            padding: ${title ? '16px 20px' : '20px'};
        `;

        // Create message
        const messageEl = document.createElement('div');
        messageEl.className = 'confirmation-dialog-message';
        messageEl.style.cssText = `
            color: var(--vscode-editor-foreground, #cccccc);
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.5;
        `;
        messageEl.textContent = message;

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'confirmation-dialog-buttons';
        buttonsContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        `;

        // Create Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = `confirmation-dialog-cancel ${config.cancelButtonClass}`;
        cancelBtn.textContent = config.cancelText;
        cancelBtn.style.cssText = `
            background-color: var(--vscode-button-secondaryBackground, #3c3c3c);
            color: var(--vscode-button-secondaryForeground, #cccccc);
            border: 1px solid var(--vscode-button-border, #6c6c6c);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
            min-width: 80px;
        `;

        // Create Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = `confirmation-dialog-confirm ${config.confirmButtonClass}`;
        confirmBtn.textContent = config.confirmText;
        confirmBtn.style.cssText = `
            background-color: var(--vscode-button-background, #0e639c);
            color: var(--vscode-button-foreground, #ffffff);
            border: 1px solid var(--vscode-button-border, #0e639c);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
            min-width: 80px;
        `;

        // Add hover effects
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.backgroundColor = 'var(--vscode-button-secondaryHoverBackground, #4c4c4c)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.backgroundColor = 'var(--vscode-button-secondaryBackground, #3c3c3c)';
        });

        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.backgroundColor = 'var(--vscode-button-hoverBackground, #1177bb)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.backgroundColor = 'var(--vscode-button-background, #0e639c)';
        });

        // Add event listeners
        cancelBtn.addEventListener('click', () => {
            this.hide();
            if (this.callback) this.callback(false);
        });

        confirmBtn.addEventListener('click', () => {
            this.hide();
            if (this.callback) this.callback(true);
        });

        // Handle escape key
        this.handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.hide();
                if (this.callback) this.callback(false);
            }
        };

        // Assemble dialog
        body.appendChild(messageEl);
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);
        body.appendChild(buttonsContainer);
        dialog.appendChild(body);
        this.overlay.appendChild(dialog);
        document.body.appendChild(this.overlay);

        // Animate in
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
            dialog.style.transform = 'scale(1)';
        });

        // Focus the confirm button
        confirmBtn.focus();

        // Add keyboard listener
        document.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Hide the confirmation dialog
     */
    hide() {
        if (this.overlay) {
            // Animate out
            this.overlay.style.opacity = '0';
            const dialog = this.overlay.querySelector('.confirmation-dialog');
            if (dialog) {
                dialog.style.transform = 'scale(0.9)';
            }

            // Remove after animation
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
            }, 200);

            // Remove keyboard listener
            document.removeEventListener('keydown', this.handleKeyDown);
        }
    }

    /**
     * Check if dialog is currently showing
     * @returns {boolean}
     */
    isShowing() {
        return this.overlay !== null;
    }

    /**
     * Static method for quick confirmation
     * @param {string} message - The message to display
     * @param {string} title - Optional title
     * @param {Object} options - Optional configuration
     * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
     */
    static async confirm(message, title = null, options = {}) {
        return new Promise((resolve) => {
            const dialog = new ConfirmationDialog();
            dialog.show(message, title, options, resolve);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationDialog;
} else if (typeof window !== 'undefined') {
    window.ConfirmationDialog = ConfirmationDialog;
}
