// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { DebugSession, DebugSessionCustomEvent } from 'vscode';
import { swallowExceptions } from '../../../common/utils/decorators';
import { IDebugSessionEventHandlers } from '../hooks/types';
import { DebuggerEvents } from '../hooks/constants';
import { DebuggerTypeName } from '../../constants';
import { IProfilingService, IProfileViewerManager, StackSample } from './types';

/**
 * Handles profiling-related debug session events
 */
@injectable()
export class ProfilingEventHandler implements IDebugSessionEventHandlers {
    constructor(
        @inject(IProfilingService) private readonly profilingService: IProfilingService,
        @inject(IProfileViewerManager) private readonly viewerManager: IProfileViewerManager,
    ) {}

    @swallowExceptions('Handle profiling event')
    public async handleCustomEvent(event: DebugSessionCustomEvent): Promise<void> {
        if (!event || event.session.configuration.type !== DebuggerTypeName) {
            return;
        }

        if (event.event === DebuggerEvents.DebugpyProfilingSamples) {
            const samples = event.body as StackSample[];
            await this.profilingService.handleProfilingSamples(event.session, samples);
        }
    }

    @swallowExceptions('Handle debug session termination')
    public async handleTerminateEvent(session: DebugSession): Promise<void> {
        if (session.configuration.type !== DebuggerTypeName) {
            return;
        }

        // Close any open profile viewers for this session
        this.viewerManager.closeProfileViewer(session);
    }
}
