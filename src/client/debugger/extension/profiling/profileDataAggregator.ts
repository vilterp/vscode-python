// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { ProfileNode, StackSample, FlameGraphData, FunctionTableRow } from './types';

/**
 * Aggregates stack samples into a weighted tree structure
 */
export class ProfileDataAggregator {
    private root: ProfileNode;
    private totalSamples: number = 0;

    constructor() {
        this.root = {
            name: 'root',
            filename: '',
            line: 0,
            selfCount: 0,
            totalCount: 0,
            children: new Map(),
        };
    }

    /**
     * Add a batch of samples to the profile tree
     */
    public addSamples(samples: StackSample[]): void {
        for (const sample of samples) {
            this.addSample(sample);
        }
    }

    /**
     * Add a single sample to the profile tree
     */
    private addSample(sample: StackSample): void {
        if (sample.frames.length === 0) {
            return;
        }

        this.totalSamples++;
        let currentNode = this.root;
        currentNode.totalCount++;

        // Process frames from bottom of stack to top
        for (let i = sample.frames.length - 1; i >= 0; i--) {
            const frame = sample.frames[i];
            const key = `${frame.filename}:${frame.line}:${frame.name}`;

            let childNode = currentNode.children.get(key);
            if (!childNode) {
                childNode = {
                    name: frame.name,
                    filename: frame.filename,
                    line: frame.line,
                    selfCount: 0,
                    totalCount: 0,
                    children: new Map(),
                };
                currentNode.children.set(key, childNode);
            }

            childNode.totalCount++;
            currentNode = childNode;
        }

        // Increment self count for the leaf node (top of stack)
        currentNode.selfCount++;
    }

    /**
     * Convert the profile tree to flame graph data format
     */
    public toFlameGraphData(): FlameGraphData {
        return this.nodeToFlameGraph(this.root);
    }

    private nodeToFlameGraph(node: ProfileNode): FlameGraphData {
        const children: FlameGraphData[] = [];
        
        for (const child of node.children.values()) {
            children.push(this.nodeToFlameGraph(child));
        }

        const name = node.name || 'root';
        const filename = node.filename ? ` (${node.filename}:${node.line})` : '';
        
        return {
            name: `${name}${filename}`,
            value: node.totalCount,
            children: children.length > 0 ? children : undefined,
            tooltip: `${name}\nTotal: ${node.totalCount} (${this.getPercent(node.totalCount)}%)\nSelf: ${node.selfCount} (${this.getPercent(node.selfCount)}%)`,
        };
    }

    /**
     * Convert the profile tree to a flat function table
     */
    public toFunctionTable(): FunctionTableRow[] {
        const rows: FunctionTableRow[] = [];
        this.collectFunctionRows(this.root, rows);
        
        // Sort by total time descending
        rows.sort((a, b) => b.totalTime - a.totalTime);
        
        return rows;
    }

    private collectFunctionRows(node: ProfileNode, rows: FunctionTableRow[]): void {
        if (node.name && node.name !== 'root') {
            rows.push({
                name: node.name,
                filename: node.filename,
                line: node.line,
                selfTime: node.selfCount,
                totalTime: node.totalCount,
                selfPercent: this.getPercent(node.selfCount),
                totalPercent: this.getPercent(node.totalCount),
            });
        }

        for (const child of node.children.values()) {
            this.collectFunctionRows(child, rows);
        }
    }

    private getPercent(count: number): number {
        return this.totalSamples > 0 ? (count / this.totalSamples) * 100 : 0;
    }

    public getTotalSamples(): number {
        return this.totalSamples;
    }
}
