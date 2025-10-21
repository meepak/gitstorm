export interface Branch {
    name: string;
    isLocal: boolean;
    isRemote: boolean;
    isCurrent: boolean;
    commit?: string;
    ahead?: number;
    behind?: number;
}

export interface Commit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: Date;
    parents: string[];
    refs: string[];
    files?: FileChange[];
}

export interface FileChange {
    file: string;
    additions: number;
    deletions: number;
    changes: number;
    status: 'A' | 'D' | 'M' | 'R' | 'C' | 'U' | '?';
    commitHash?: string; // Optional commit hash for multi-commit scenarios
}

export interface Stash {
    index: number;
    name: string; // stash@{N}
    message: string;
    branch: string;
    commit: string;
    commitSubject: string;
}