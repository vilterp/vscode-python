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

        // Process frames from bottom of stack (outermost) to top (innermost)
        // frames[0] = bottom/root (e.g., main), frames[n-1] = top/leaf (currently executing)
        for (let i = 0; i < sample.frames.length; i++) {
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

        // Increment self count for the leaf node (currently executing, top of stack)
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
        const functionMap = new Map<string, FunctionTableRow>();
        this.collectFunctionRows(this.root, functionMap);
        
        const rows = Array.from(functionMap.values());
        
        // Recalculate percentages based on total samples
        for (const row of rows) {
            row.selfPercent = this.getPercent(row.selfTime);
            row.totalPercent = this.getPercent(row.totalTime);
        }
        
        // Sort by total time descending
        rows.sort((a, b) => b.totalTime - a.totalTime);
        
        return rows;
    }

    private collectFunctionRows(node: ProfileNode, functionMap: Map<string, FunctionTableRow>): void {
        if (node.name && node.name !== 'root') {
            const key = `${node.filename}:${node.line}:${node.name}`;
            
            let row = functionMap.get(key);
            if (!row) {
                row = {
                    name: node.name,
                    filename: node.filename,
                    line: node.line,
                    selfTime: 0,
                    totalTime: 0,
                    selfPercent: 0,
                    totalPercent: 0,
                };
                functionMap.set(key, row);
            }
            
            row.selfTime += node.selfCount;
            row.totalTime += node.totalCount;
        }

        for (const child of node.children.values()) {
            this.collectFunctionRows(child, functionMap);
        }
    }

    private getPercent(count: number): number {
        return this.totalSamples > 0 ? (count / this.totalSamples) * 100 : 0;
    }

    public getTotalSamples(): number {
        return this.totalSamples;
    }
}
