// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { DebugSession } from 'vscode';
import { traceError, traceLog } from '../../../logging';
import { IProfilingService, IProfileViewerManager, StackSample } from './types';

@injectable()
export class ProfilingService implements IProfilingService {
    constructor(@inject(IProfileViewerManager) private readonly viewerManager: IProfileViewerManager) {}

    public async startProfiling(session: DebugSession): Promise<void> {
        try {
            traceLog(`Starting profiling for session: ${session.name}`);
            
            // Send DAP request to start profiling
            await session.customRequest('startProfiling', {
                interval: 0.01, // 10ms sampling interval
            });

            // Show the profile viewer
            await this.viewerManager.showProfileViewer(session);
            
            traceLog('Profiling started successfully');
        } catch (error) {
            traceError('Failed to start profiling:', error);
            throw error;
        }
    }

    public async stopProfiling(session: DebugSession): Promise<void> {
        try {
            traceLog(`Stopping profiling for session: ${session.name}`);
            
            // Send DAP request to stop profiling
            await session.customRequest('stopProfiling', {});
            
            traceLog('Profiling stopped successfully');
        } catch (error) {
            traceError('Failed to stop profiling:', error);
            throw error;
        }
    }

    public async handleProfilingSamples(session: DebugSession, samples: StackSample[]): Promise<void> {
        try {
            traceLog(`Received ${samples.length} profiling samples`);
            
            // Update the profile viewer with new samples
            await this.viewerManager.updateWithSamples(session, samples);
        } catch (error) {
            traceError('Failed to handle profiling samples:', error);
        }
    }
}
