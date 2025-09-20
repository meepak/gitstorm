import * as vscode from 'vscode';
import { GitStormPanel } from '../core/GitStormPanel';
import { CommitHandler } from './CommitHandler';
import { FileHandler } from './FileHandler';
import { BranchHandler } from './BranchHandler';
import { WorkingDirectoryHandler } from './WorkingDirectoryHandler';

export class MessageHandler {
    private readonly _commitHandler: CommitHandler;
    private readonly _fileHandler: FileHandler;
    private readonly _branchHandler: BranchHandler;
    private readonly _workingDirectoryHandler: WorkingDirectoryHandler;

    constructor(private readonly panel: GitStormPanel) {
        this._commitHandler = new CommitHandler(panel);
        this._fileHandler = new FileHandler(panel);
        this._branchHandler = new BranchHandler(panel);
        this._workingDirectoryHandler = new WorkingDirectoryHandler(panel);
    }

    async handleMessage(message: any) {
        console.log('Message received:', message);
        
        try {
            switch (message.command) {
                case 'refresh':
                    await this.panel.refresh();
                    break;

                case 'selectBranch':
                    this.panel.selectedBranch = message.branchName;
                    await this.panel.refresh();
                    break;

                case 'selectCommit':
                    await this._commitHandler.handleCommitSelection(message.hash);
                    break;

                case 'squashCommits':
                    await this._commitHandler.handleSquashCommits(message.commitHashes, message.message);
                    break;

                case 'test':
                    console.log('Test message received');
                    break;

                case 'savePanelSizes':
                    this.panel.panelSizes = message.sizes;
                    break;

                case 'getCommitDetails':
                    console.log('Backend: Handling getCommitDetails for hash:', message.commitHashes || message.hash);
                    if (message.commitHashes && message.commitHashes.length > 1) {
                        await this._commitHandler.handleGetMultiCommitFiles(message.commitHashes, message.compareAgainst, message.compareBranch);
                    } else {
                        const hash = message.commitHashes ? message.commitHashes[0] : message.hash;
                        await this._commitHandler.handleGetCommitDetails(hash, message.compareAgainst, message.compareBranch);
                    }
                    break;

                case 'getMultiCommitFiles':
                    await this._commitHandler.handleGetMultiCommitFiles(message.commitHashes, message.compareAgainst, message.compareBranch);
                    break;

                case 'showFileDiff':
                    console.log('🚀🚀🚀 MessageHandler: showFileDiff message received:', message);
                    await this._fileHandler.handleShowFileDiff(message.filePath, message.commitHash, message.parentIndex, message.compareAgainst, message.compareBranch);
                    break;

                case 'showMultiCommitFileDiff':
                    await this._fileHandler.handleShowMultiCommitFileDiff(message.filePath, message.commitHashes);
                    break;

                case 'showFileDiffWithCompare':
                    await this._fileHandler.handleShowFileDiffWithCompare(message.filePath, message.compareData);
                    break;

                case 'showFileDiffWithWorking':
                    await this._fileHandler.handleShowFileDiffWithWorking(message.filePath, message.commitHash);
                    break;

                case 'showFileDiffWithBranch':
                    await this._fileHandler.handleShowFileDiffWithBranch(message.filePath, message.commitHash);
                    break;

                case 'showWorkingDirectoryChanges':
                    await this._workingDirectoryHandler.handleShowWorkingDirectoryChanges();
                    break;

                case 'showEditableDiff':
                    await this._fileHandler.handleShowEditableDiff(message.filePath, message.compareData);
                    break;

                case 'openWorkingFile':
                    await this._workingDirectoryHandler.handleOpenWorkingFile(message.filePath);
                    break;

                case 'getCommitsWithCompare':
                    await this._commitHandler.handleGetCommitsWithCompare(message.branch, message.compareBranch);
                    break;

                case 'revealFileInExplorer':
                    await this._fileHandler.handleRevealFileInExplorer(message.filePath);
                    break;

                case 'revealDirectoryInExplorer':
                    await this._fileHandler.handleRevealDirectoryInExplorer(message.directoryName);
                    break;

                case 'checkoutBranch':
                    await this._branchHandler.handleCheckoutBranch(message.branchName);
                    break;

                case 'mergeBranch':
                    await this._branchHandler.handleMergeBranch(message.branchName);
                    break;

                case 'deleteBranch':
                    await this._branchHandler.handleDeleteBranch(message.branchName);
                    break;

                case 'createBranchFromCommit':
                    await this._branchHandler.handleCreateBranchFromCommit(message.commitHash);
                    break;

                case 'cherryPickCommit':
                    await this._commitHandler.handleCherryPickCommit(message.commitHash);
                    break;

                case 'revertCommit':
                    await this._commitHandler.handleRevertCommit(message.commitHash);
                    break;

                case 'getUncommittedChanges':
                    await this._workingDirectoryHandler.handleGetUncommittedChanges();
                    break;

                case 'commitChanges':
                    await this._workingDirectoryHandler.handleCommitChanges(message.message);
                    break;

                case 'openFile':
                    await this._fileHandler.handleOpenFile(message.fileName);
                    break;

                case 'getStagedChanges':
                    await this._workingDirectoryHandler.handleGetStagedChanges();
                    break;

                case 'stageAllChanges':
                    await this._workingDirectoryHandler.handleStageAllChanges();
                    break;

                case 'stageFile':
                    await this._workingDirectoryHandler.handleStageFile(message.filePath);
                    break;

                case 'unstageAllChanges':
                    await this._workingDirectoryHandler.handleUnstageAllChanges();
                    break;

                case 'unstageFile':
                    await this._workingDirectoryHandler.handleUnstageFile(message.filePath);
                    break;

                case 'revertFile':
                    await this._workingDirectoryHandler.handleRevertFile(message.filePath);
                    break;

                case 'stashChanges':
                    await this._workingDirectoryHandler.handleStashChanges(message.message);
                    break;

                case 'commitStagedChanges':
                    await this._workingDirectoryHandler.handleCommitStagedChanges(message.message);
                    break;

                case 'commitAndPushStagedChanges':
                    await this._workingDirectoryHandler.handleCommitAndPushStagedChanges(message.message);
                    break;

                case 'pushCommit':
                    await this._workingDirectoryHandler.handlePushCommit(message.commitHash);
                    break;

                default:
                    console.log('Unknown message command:', message.command);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            this.panel.panel.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
