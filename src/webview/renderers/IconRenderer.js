// Icon Renderer - Handles file type icons and status icons
class IconRenderer {
    constructor(panelController) {
        this.panel = panelController;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'A': return '➕';
            case 'D': return '➖';
            case 'M': return '📝';
            case 'R': return '🔄';
            default: return '📄';
        }
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
