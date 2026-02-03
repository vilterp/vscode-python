// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { debug } from 'vscode';
import { IExtensionSingleActivationService } from '../../../activation/types';
import { ICommandManager } from '../../../common/application/types';
import { Commands } from '../../../common/constants';
import { IDisposableRegistry } from '../../../common/types';
import { traceError, traceLog } from '../../../logging';
import { IProfilingService } from './types';

@injectable()
export class ProfilingCommands implements IExtensionSingleActivationService {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };

    constructor(
        @inject(ICommandManager) private readonly commandManager: ICommandManager,
        @inject(IDisposableRegistry) private readonly disposables: IDisposableRegistry,
        @inject(IProfilingService) private readonly profilingService: IProfilingService,
    ) {}

    public activate(): Promise<void> {
        this.disposables.push(
            this.commandManager.registerCommand(Commands.Start_Profiling, async () => {
                const activeSession = debug.activeDebugSession;
                if (!activeSession) {
                    traceError('No active debug session');
                    return;
                }

                try {
                    await this.profilingService.startProfiling(activeSession);
                } catch (error) {
                    traceError('Failed to start profiling:', error);
                }
            }),
        );

        this.disposables.push(
            this.commandManager.registerCommand(Commands.Stop_Profiling, async () => {
                const activeSession = debug.activeDebugSession;
                if (!activeSession) {
                    traceError('No active debug session');
                    return;
                }

                try {
                    await this.profilingService.stopProfiling(activeSession);
                } catch (error) {
                    traceError('Failed to stop profiling:', error);
                }
            }),
        );

        traceLog('Profiling commands registered');
        return Promise.resolve();
    }
}
