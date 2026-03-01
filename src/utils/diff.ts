/**
 * Simple line-based diff utility.
 * Computes differences between two strings using a basic LCS (Longest Common Subsequence) approach.
 * No external dependencies required.
 */

export type DiffLineType = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
    type: DiffLineType;
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

/**
 * Computes a unified diff between two strings.
 * Returns an array of DiffLine objects with type, content, and line numbers.
 */
export function computeDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    // Build LCS table
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to build diff
    const result: DiffLine[] = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            result.unshift({
                type: 'unchanged',
                content: oldLines[i - 1],
                oldLineNumber: i,
                newLineNumber: j,
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({
                type: 'added',
                content: newLines[j - 1],
                newLineNumber: j,
            });
            j--;
        } else {
            result.unshift({
                type: 'removed',
                content: oldLines[i - 1],
                oldLineNumber: i,
            });
            i--;
        }
    }

    return result;
}

/**
 * Returns a summary of changes: number of additions, deletions, and modifications.
 */
export function diffStats(diff: DiffLine[]): { additions: number; deletions: number } {
    let additions = 0;
    let deletions = 0;
    for (const line of diff) {
        if (line.type === 'added') additions++;
        if (line.type === 'removed') deletions++;
    }
    return { additions, deletions };
}
