// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { DebugSession } from 'vscode';

export const IProfilingService = Symbol('IProfilingService');
export interface IProfilingService {
    startProfiling(session: DebugSession): Promise<void>;
    stopProfiling(session: DebugSession): Promise<void>;
    handleProfilingSamples(session: DebugSession, samples: StackSample[]): Promise<void>;
}

export const IProfileViewerManager = Symbol('IProfileViewerManager');
export interface IProfileViewerManager {
    showProfileViewer(session: DebugSession): Promise<void>;
    updateWithSamples(session: DebugSession, samples: StackSample[]): Promise<void>;
    closeProfileViewer(session: DebugSession): void;
}

// Represents a single stack trace sample from the debugger
export interface StackSample {
    timestamp: number;
    threadId: number;
    frames: StackFrame[];
}

// Represents a single stack frame in a sample
export interface StackFrame {
    name: string;
    filename: string;
    line: number;
    module?: string;
}

// Weighted tree node for aggregating samples
export interface ProfileNode {
    name: string;
    filename: string;
    line: number;
    selfCount: number;
    totalCount: number;
    children: Map<string, ProfileNode>;
}

// Data format for the flame graph component
export interface FlameGraphData {
    name: string;
    value: number;
    children?: FlameGraphData[];
    tooltip?: string;
}

// Data format for the function table
export interface FunctionTableRow {
    name: string;
    filename: string;
    line: number;
    selfTime: number;
    totalTime: number;
    selfPercent: number;
    totalPercent: number;
}
