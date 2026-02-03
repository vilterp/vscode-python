// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { assert } from 'chai';
import { ProfileDataAggregator } from '../../../../client/debugger/extension/profiling/profileDataAggregator';
import { StackSample } from '../../../../client/debugger/extension/profiling/types';

suite('Profile Data Aggregator Tests', () => {
    let aggregator: ProfileDataAggregator;

    setup(() => {
        aggregator = new ProfileDataAggregator();
    });

    test('Should handle empty samples', () => {
        aggregator.addSamples([]);
        assert.equal(aggregator.getTotalSamples(), 0);
    });

    test('Should aggregate single sample', () => {
        const sample: StackSample = {
            timestamp: 1000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
            ],
        };

        aggregator.addSamples([sample]);
        assert.equal(aggregator.getTotalSamples(), 1);

        const flameGraph = aggregator.toFlameGraphData();
        assert.ok(flameGraph);
        assert.equal(flameGraph.value, 1);
    });

    test('Should aggregate multiple samples with same stack', () => {
        const sample1: StackSample = {
            timestamp: 1000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
            ],
        };

        const sample2: StackSample = {
            timestamp: 2000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
            ],
        };

        aggregator.addSamples([sample1, sample2]);
        assert.equal(aggregator.getTotalSamples(), 2);

        const table = aggregator.toFunctionTable();
        assert.ok(table.length > 0);
        
        const func1Entry = table.find((row) => row.name === 'func1');
        assert.ok(func1Entry, 'func1Entry should exist');
        assert.equal(func1Entry!.totalTime, 2);
        assert.equal(func1Entry!.selfTime, 2);
    });

    test('Should aggregate samples with different stacks', () => {
        const sample1: StackSample = {
            timestamp: 1000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
            ],
        };

        const sample2: StackSample = {
            timestamp: 2000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func2', filename: 'test.py', line: 30 },
            ],
        };

        aggregator.addSamples([sample1, sample2]);
        assert.equal(aggregator.getTotalSamples(), 2);

        const table = aggregator.toFunctionTable();
        assert.ok(table.length >= 3); // main, func1, func2

        const mainEntry = table.find((row) => row.name === 'main');
        assert.ok(mainEntry, 'mainEntry should exist');
        assert.equal(mainEntry!.totalTime, 2);
    });

    test('Should calculate percentages correctly', () => {
        const samples: StackSample[] = [];
        for (let i = 0; i < 100; i++) {
            samples.push({
                timestamp: i,
                threadId: 1,
                frames: [
                    { name: 'main', filename: 'test.py', line: 10 },
                    { name: 'func1', filename: 'test.py', line: 20 },
                ],
            });
        }

        aggregator.addSamples(samples);
        const table = aggregator.toFunctionTable();

        const func1Entry = table.find((row) => row.name === 'func1');
        assert.ok(func1Entry, 'func1Entry should exist');
        assert.equal(func1Entry!.totalPercent, 100);
        assert.equal(func1Entry!.selfPercent, 100);
    });

    test('Should handle nested function calls', () => {
        const sample1: StackSample = {
            timestamp: 1000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
                { name: 'func2', filename: 'test.py', line: 30 },
            ],
        };

        const sample2: StackSample = {
            timestamp: 2000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
            ],
        };

        aggregator.addSamples([sample1, sample2]);
        assert.equal(aggregator.getTotalSamples(), 2);

        const table = aggregator.toFunctionTable();
        
        const func1Entry = table.find((row) => row.name === 'func1');
        assert.ok(func1Entry, 'func1Entry should exist');
        assert.equal(func1Entry!.totalTime, 2, 'func1 should appear in 2 samples');
        assert.equal(func1Entry!.selfTime, 1, 'func1 should be at top of stack in 1 sample');

        const func2Entry = table.find((row) => row.name === 'func2');
        assert.ok(func2Entry, 'func2Entry should exist');
        assert.equal(func2Entry!.totalTime, 1);
        assert.equal(func2Entry!.selfTime, 1);
    });

    test('Should generate flame graph data structure', () => {
        const sample: StackSample = {
            timestamp: 1000,
            threadId: 1,
            frames: [
                { name: 'main', filename: 'test.py', line: 10 },
                { name: 'func1', filename: 'test.py', line: 20 },
                { name: 'func2', filename: 'test.py', line: 30 },
            ],
        };

        aggregator.addSamples([sample]);
        const flameGraph = aggregator.toFlameGraphData();

        assert.ok(flameGraph);
        assert.ok(flameGraph.children);
        assert.ok(flameGraph.children!.length > 0);
        
        // Root should have one child (main)
        const mainNode = flameGraph.children![0];
        assert.ok(mainNode.name.includes('main'));
        
        // Main should have one child (func1)
        assert.ok(mainNode.children);
        assert.ok(mainNode.children!.length > 0);
        
        const func1Node = mainNode.children![0];
        assert.ok(func1Node.name.includes('func1'));
    });
});
