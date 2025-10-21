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


# TODO

    ## Stash Requirements
        Placement:
            Add a “Stashes” section in the Branches panel.
            List entries as stash@{N}: <message> with originating branch and commit subject.

        Display:
            Clicking a stash loads its commits/diffs in the Commits panel, same as a branch.
            File changes panel supports same compare options (prev, working dir, other branch).
            Actions (context menu):
            Apply → git stash apply stash@{N}
            Pop → git stash pop stash@{N}
            Drop → git stash drop stash@{N}
            Create branch → git stash branch <name> stash@{N}

        Behavior:
            Treat each stash like a temporary branch ref.
            Allow viewing diffs without applying.
            Safe-delete (drop) with confirmation.


    ## DAG Indicator Requirements
        Placement
            Commits Panel:
                - Show the DAG indicator (graph lines and nodes) alongside the list of commits.
                - Each commit row has a small left-margin column for DAG lines.
                - Branch labels (HEAD, feature names, tags) appear inline with the node.

        Representation
            Nodes:
                - Small circles for commits.
                - Highlight the current commit (selected row) with a filled/colored circle.
            Edges:
                - Vertical and diagonal lines connect parent/child commits.
                - Each branch/merge path has a unique, consistent color.
            Labels:
                - Show branch/tag names near their tip commits (similar to git log --decorate --oneline --graph).
            Uncommitted changes:
                - Display as a synthetic node (e.g., hollow circle at the top of the DAG when the working tree is dirty).
            Interaction
                - Clicking a node = select that commit.
                - Multi-select continues to work (highlight multiple nodes).
                - Hover shows quick info: commit hash, author, date.
                - Right-click menu (same as commit list: revert, cherry-pick, checkout, etc.).
            Modes
                - Single branch mode: show commits only from the selected branch, DAG lines limited to that branch.
                - Compare mode (branch A vs branch B):
                - Show both DAGs in one view, with diverged commits emphasized.
                - Commits exclusive to A or B are highlighted.
                - All commits mode: full DAG across all refs, like git log --all --graph.
            Performance
                - Virtualized list rendering (only visible rows draw lines).
                - Colors reused cyclically when too many branches exist.
                - Lazy-load more history on scroll.

        
        DAG   Commit (subject)                          Meta
        │                                            [develop]
        ●──┐  7ffc552  bug fixes                      Deepak · Aug 19
        │  │
        │  ●  777896e  Event Emitter pycache…         Deepak · Aug 17
        │  │
        │  ●  af429d3  EventEmitter class for…        Deepak · Aug 17
        │  │
        │  │  ┌──●  8c5d01a  user account level…      Deepak · Aug 17   (side branch)
        │  └──┘
        │
        ●──┬──●  6efd4da  deployment service bug      Deepak · Jul 24   (merge)
        │  │
        │  ●  1353e0c  add end point for browse…      Deepak · Jul 24
        │  │
        │  ●  f190bf1  sts service used in s3…        Deepak · Jul 21
        │  │
        └──●  824036e  missing function parameter     Deepak · Jul 14


    ## Branches Panel Context Menu

        ### Local branch (not current)

        - **Checkout / Switch to this branch** → `git switch <branch>`
        - **Compare against…** (set as compare target for Commits/Changes panels)
        - Local branches list
        - Remote branches (grouped)
        - Default quick item: `main` (or repo default)
        - **Merge into current branch** (fast-forward allowed) → `git merge <branch>`
        - **Rebase current branch onto this** → `git rebase <branch>`
        - **Create new branch from here…** → prompt name → `git branch <new> <branch>`
        - **Rename…** → `git branch -m <old> <new>` (disallow if remote-tracking exists without updating)
        - **Set upstream…** (track remote) → choose remote ref →  
        `git branch -u <remote>/<name> <branch>`
        - **Unset upstream** → `git branch --unset-upstream <branch>`
        - **Delete**
        - Safe: `git branch -d <branch>` (refuse if unmerged)
        - Force: `git branch -D <branch>` (confirm with warning + show tip SHA)
        - **Protect / Unprotect** (plugin-level setting) → toggles a “are you sure?” gate on delete/force push for critical branches
        - **Open file history filtered to this branch** → switch Commits panel scope

        ---

        ### Local branch (current)

        - **Commit template / Amend last commit** → open quick commit actions
        - **Push / Pull / Fetch (this branch)** → `git push`, `git pull --rebase`, `git fetch`
        - **Rebase onto…** (pick target) → `git rebase <target>`
        - **Merge…** (pick source branch into current) → `git merge <source>`
        - **Create worktree here…** → dir prompt → `git worktree add <path> <branch>`
        - **Stash changes… (quick)**
        - Stash (all/keep index/include untracked) → `git stash push [-k|-u] -m "<msg>"`
        - Stash & Track as todo (plugin note)

        ---

        ### Remote branch (`origin/...`)

        - **Checkout as new local…** →  
        `git switch -c <new> --track <remote>/<name>`
        - **Track with existing local…** → pick local →  
        `git branch -u <remote>/<name> <local>`
        - **Compare against…** (sets compare target; show “stale data” hint if last fetch too old)
        - **Fetch only this branch** →  
        `git fetch origin <name>:refs/remotes/origin/<name>`
        - **Delete remote branch…** (confirm) →  
        `git push origin --delete <name>`
        - **Open on host** (if remote = GitHub/GitLab/Bitbucket and URL known) → open PRs/commits page

        ---

        ### Group headers (sections)

        ### Local (header)
        - **New branch…** → `git switch -c <name>`

        ### origin (header)
        - **Fetch/prune** → `git fetch --prune origin`
        - **Add remote… / Edit remote… / Remove remote**

        ### Stashes (header) *(if you show stashes here)*
        - **New stash…** (same options as above)
        - **Apply latest / Pop latest**

        ---

        ### Stash entry (if listed under Branches)

        - **Apply** → `git stash apply stash@{n}`
        - **Pop** → `git stash pop stash@{n}`
        - **Drop** → `git stash drop stash@{n}` (confirm)
        - **Create branch from stash…** →  
        `git stash branch <name> stash@{n}`
        - **View diff** → load stash into Commits/Changes panels

        ---

        ### Multi-select actions (Local)

        - **Delete selected**
        - Safe delete all (show per-branch success/fail)
        - Force delete (single confirmation listing all)
        - **Compare A…B** (enabled when exactly two selected) → opens compare mode in Commits panel
        - **Merge selected into current** (queue merges; stop on conflict)

        ---

        ### Safety & UX rules

        - Disable destructive actions on **current branch** (`delete`, `rename`).
        - For **protected branches** (e.g., `main`, `release/*`), require extra confirmation; optionally block force delete.
        - Before remote comparisons, if last fetch > N minutes, show *“Data may be stale”* with **Fetch now** shortcut.
        - On **force delete unmerged**, display the **tip SHA** with copy button and hint to recover:  
        `git branch <name> <sha>` or `git reflog`
        - Show **ahead/behind badge** in the menu header (e.g., `↑2 ↓1 vs origin/main`) and a quick action *“Rebase onto upstream”*.
        - All long-running ops show progress and expose **Continue/Abort** for rebase/cherry-pick/merge conflict flows.




    ## Lost & Found (Dangling Commits) Section

        ### Placement
        - **Branches Panel** → bottom section, below **Stashes**.
        - Collapsed by default.
        - Header shows **“Lost & Found (Dangling)”** with a commit count badge when entries are detected.

        ---

        ### Discovery
        - Trigger scan **only when expanded** (avoid perf cost at startup).
        - Methods:
        - **Fast scan**:  
            - `git rev-list --all` → reachable set.  
            - `git reflog --all --format='%H %gd %gs'` → reflog entries.  
            - **Dangling = reflog commits not in reachable set**.  
        - **Deep scan** (optional toggle):  
            - `git fsck --no-reflogs --unreachable --no-progress --lost-found`  
            - Parse `dangling commit <sha>` lines.  
        - Cache results until user performs a fetch/rebase/GC or clicks **Rescan**.

        ---

        ### UI Layout

            Lost & Found (Dangling) ▼ (3)
            • 7f3a1c2 WIP: refactor deploy Deepak · Aug 17, 2025
            • 8e9b0a4 Fix migration bug Ashley · Aug 10, 2025
            • 91ab2c7 Temp logging changes teddinata · Jul 29, 2025

        ### Branches Panel

        - Each entry shows:
        - Short SHA
        - Commit message (truncated)
        - Author + date
        - Tooltip (hover):  
        - Full SHA  
        - Origin hint (from reflog, e.g., `main@{2025-08-17 05:09}`)  
        - Status: *Recoverable* / *Unreachable (subject to GC)*  

        ---

        ### Commits Panel
        - Clicking a lost commit loads it in **Commits Panel**:
        - Single node row (no branch labels).
        - Commit details (hash, author, date, message).
        - Supports multi-select (e.g., recover multiple commits).

        ---

        ### Changes Panel
        - Shows file changes for the lost commit using:  
        `git show -p <sha>`  

        ### Diff Viewer
        - Same as normal commit diff:
        - Added/removed files, hunks, syntax highlighting.

        ---

        ### Context Menu (Lost Commit)
        - **Checkout (detached HEAD)** → `git checkout <sha>`
        - **Create branch here…** → `git branch <name> <sha>`
        - **Create tag here…** → `git tag -a <name> <sha>`
        - **Cherry-pick onto current branch** → `git cherry-pick <sha>`
        - **Open diff vs…**
        - Working tree → `git diff <sha>`
        - Branch… → `git diff <branch> <sha>`
        - **Restore file(s)…** → `git restore --source=<sha> <path>`
        - **Show patch** → `git show <sha> --patch`
        - **Copy SHA**

        ---

        ### Safety & UX
        - Show banner when expanded:  
        > “These commits are not referenced by any branch or tag. They may be garbage-collected. Create a branch or tag to keep them.”
        - Display GC expiry hints if available:  
        - `git config --get gc.reflogExpire`  
        - `git config --get gc.pruneExpire`
        - Confirm before destructive actions (e.g., dropping from reflog, if supported).
        - Multi-select:
        - **Recover selected** (create branches from all).
        - **Cherry-pick selected**.
        - Paginate list if more than 200 entries (load more).

        ---

        ### Settings
        - Enable/disable **Lost & Found** section (default: on).
        - Toggle **Deep scan** with `git fsck` (default: off).
        - Limit: maximum N days old (default 90).
        - Limit max items (default 200).

        ---




    ## Commits Panel Context Menu

        ### Single Commit (Right-click on a commit)

            - **Checkout this commit (detached HEAD)**  
            → `git checkout <sha>`

            - **Create new branch from commit…**  
            → prompt name → `git branch <new> <sha>`

            - **Create new tag from commit…**  
            → prompt name/message → `git tag -a <tag> <sha> -m "<msg>"`

            - **Cherry-pick commit onto current branch**  
            → `git cherry-pick <sha>`

            - **Revert commit**  
            → `git revert <sha>`

            - **Compare commit with…**  
            - Previous commit (default) → `git diff <sha>^ <sha>`  
            - Working directory → `git diff <sha>`  
            - Any branch… → `git diff <branch> <sha>`

            - **Copy**  
            - Copy short SHA  
            - Copy full SHA  
            - Copy commit message

            - **View patch (raw diff)**  
            → `git show <sha> --patch`

            - **Blame this commit (open file history for commit’s files)**  
            → opens Changes/Diff scoped to this commit.

            ---

        ### Multiple Commits (Multi-select)

            - **Compare selected commits (squash diff)**  
            - Contiguous range → `git diff <first>^ <last>`  
            - Non-contiguous → virtual merge diff across selected commits.

            - **Cherry-pick selected commits (in order)**  
            → `git cherry-pick <sha1> <sha2> …`

            - **Revert selected commits**  
            → `git revert <sha1> <sha2> …`

            - **Create branch from last selected commit**  
            → `git branch <new> <sha>`

            - **Export patch file…**  
            → `git format-patch <sha1>^..<shaN>`

            ---

        ### Uncommitted Changes (Synthetic commit at top)

            - **Commit staged changes…**  
            → open commit input  
            - **Amend last commit**  
            → `git commit --amend`  
            - **Stash changes…**  
            - Stash all / keep index / include untracked  
            - **Discard changes…**  
            - Entire working directory  
            - Per file (via Changes panel)  

            ---

        ### Navigation / History

            - **Show file history from this commit**  
            → `git log -- <file>` filtered by commit’s file list  
            - **Open on remote (GitHub/GitLab/Bitbucket)**  
            → opens commit in web UI if remote URL is known  
            - **Mark as baseline (for diff)**  
            → set as left side of comparison, then select another commit to diff against  

            ---

        ### Safety & UX

            - Disable destructive actions (`revert`, `cherry-pick`) when a rebase/merge is in progress.  
            - Confirm on destructive multi-select (e.g., revert 10 commits).  
            - On cherry-pick/revert conflict, surface **Continue / Abort** options directly in the Commits panel.  
            - Keyboard shortcuts:  
            - `C` = Checkout commit  
            - `B` = Create branch from commit  
            - `T` = Tag commit  
            - `P` = Cherry-pick  
            - `R` = Revert  
            - `D` = Diff against…  
            - `Ctrl+C` = Copy SHA  

            ---


    ## Commits requirement refine around multiple commit selection

    ## Put Some buttons like push/pull, configuration, etc.. in header right cornor

    ## Test and make sure File diff is correct in all situation .. for uncommitted changes, easier to see and maintain,...

    ## BUG:::: When loading the main panel, commit is highlighted but not actually selected