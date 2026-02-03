// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { DebugSessionCustomEvent } from 'vscode';
import { swallowExceptions } from '../../../common/utils/decorators';
import { IDebugSessionEventHandlers } from '../hooks/types';
import { DebuggerEvents } from '../hooks/constants';
import { DebuggerTypeName } from '../../constants';
import { IProfilingService, StackSample } from './types';

/**
 * Handles profiling-related debug session events
 */
@injectable()
export class ProfilingEventHandler implements IDebugSessionEventHandlers {
    constructor(@inject(IProfilingService) private readonly profilingService: IProfilingService) {}

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
}
