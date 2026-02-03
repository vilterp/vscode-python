// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { DebugSession, ViewColumn, WebviewPanel, window, Uri } from 'vscode';
import { IExtensionContext } from '../../../common/types';
import { traceError, traceLog } from '../../../logging';
import { IProfileViewerManager, StackSample } from './types';
import { ProfileDataAggregator } from './profileDataAggregator';

@injectable()
export class ProfileViewerManager implements IProfileViewerManager {
    private panels: Map<string, WebviewPanel> = new Map();
    private aggregators: Map<string, ProfileDataAggregator> = new Map();

    constructor(@inject(IExtensionContext) private readonly context: IExtensionContext) {}

    public async showProfileViewer(session: DebugSession): Promise<void> {
        const sessionKey = this.getSessionKey(session);
        
        // Close existing panel if any
        this.closeProfileViewer(session);

        // Create new aggregator for this session
        const aggregator = new ProfileDataAggregator();
        this.aggregators.set(sessionKey, aggregator);

        // Create webview panel
        const panel = window.createWebviewPanel(
            'pythonProfileViewer',
            `Profile: ${session.name}`,
            ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [Uri.joinPath(this.context.extensionUri, 'out', 'profiling')],
            },
        );

        this.panels.set(sessionKey, panel);

        // Set up the webview content
        panel.webview.html = this.getWebviewContent(panel);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleMessage(session, message);
            },
            undefined,
            this.context.subscriptions,
        );

        // Clean up when panel is disposed
        panel.onDidDispose(
            () => {
                this.panels.delete(sessionKey);
                this.aggregators.delete(sessionKey);
            },
            undefined,
            this.context.subscriptions,
        );

        traceLog(`Profile viewer opened for session: ${session.name}`);
    }

    public async updateWithSamples(session: DebugSession, samples: StackSample[]): Promise<void> {
        const sessionKey = this.getSessionKey(session);
        const panel = this.panels.get(sessionKey);
        const aggregator = this.aggregators.get(sessionKey);

        if (!panel || !aggregator) {
            traceError('Profile viewer not found for session');
            return;
        }

        // Add samples to aggregator
        aggregator.addSamples(samples);

        // Generate updated data
        const flameGraphData = aggregator.toFlameGraphData();
        const functionTable = aggregator.toFunctionTable();

        // Send update to webview
        await panel.webview.postMessage({
            command: 'updateProfile',
            data: {
                flameGraph: flameGraphData,
                functionTable: functionTable,
                totalSamples: aggregator.getTotalSamples(),
            },
        });

        traceLog(`Updated profile viewer with ${samples.length} new samples`);
    }

    public closeProfileViewer(session: DebugSession): void {
        const sessionKey = this.getSessionKey(session);
        const panel = this.panels.get(sessionKey);
        
        if (panel) {
            panel.dispose();
            this.panels.delete(sessionKey);
            this.aggregators.delete(sessionKey);
            traceLog(`Profile viewer closed for session: ${session.name}`);
        }
    }

    private async handleMessage(session: DebugSession, message: any): Promise<void> {
        switch (message.command) {
            case 'refresh':
                // Re-send current profile data
                await this.updateWithSamples(session, []);
                break;
            case 'clear':
                // Clear profile data and restart
                const sessionKey = this.getSessionKey(session);
                this.aggregators.set(sessionKey, new ProfileDataAggregator());
                await this.updateWithSamples(session, []);
                break;
            default:
                traceError(`Unknown message command: ${message.command}`);
        }
    }

    private getSessionKey(session: DebugSession): string {
        return `${session.id}`;
    }

    private getWebviewContent(panel: WebviewPanel): string {
        // Generate a nonce for Content Security Policy
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Python Profile Viewer</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        #container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #header {
            padding: 10px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
        }
        #stats {
            font-size: 14px;
            margin-bottom: 10px;
        }
        #controls {
            margin-bottom: 10px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            margin-right: 8px;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        #content {
            flex: 1;
            overflow: auto;
        }
        #flame-graph {
            width: 100%;
            height: 400px;
            border: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
            overflow: auto;
        }
        #function-table-container {
            width: 100%;
            overflow: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        th {
            background-color: var(--vscode-editor-background);
            font-weight: 600;
            position: sticky;
            top: 0;
            cursor: pointer;
            user-select: none;
        }
        th:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .number {
            text-align: right;
        }
        .sort-indicator {
            margin-left: 4px;
            font-size: 10px;
        }
        .flame-node {
            position: absolute;
            cursor: pointer;
            border: 1px solid rgba(0,0,0,0.1);
            font-size: 11px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            padding: 2px 4px;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="header">
            <div id="stats">Total Samples: <span id="total-samples">0</span></div>
            <div id="controls">
                <button id="refresh-btn">Refresh</button>
                <button id="clear-btn">Clear</button>
            </div>
        </div>
        <div id="content">
            <div id="flame-graph"></div>
            <div id="function-table-container">
                <table id="function-table">
                    <thead>
                        <tr>
                            <th data-sort="name">Function</th>
                            <th data-sort="filename">File</th>
                            <th data-sort="line" class="number">Line</th>
                            <th data-sort="selfTime" class="number">Self</th>
                            <th data-sort="selfPercent" class="number">Self %</th>
                            <th data-sort="totalTime" class="number">Total</th>
                            <th data-sort="totalPercent" class="number">Total %</th>
                        </tr>
                    </thead>
                    <tbody id="function-table-body">
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            let currentData = null;
            let sortColumn = 'totalTime';
            let sortDirection = 'desc';

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateProfile') {
                    currentData = message.data;
                    updateUI();
                }
            });

            function updateUI() {
                if (!currentData) return;

                // Update stats
                document.getElementById('total-samples').textContent = currentData.totalSamples;

                // Update flame graph
                renderFlameGraph(currentData.flameGraph);

                // Update function table
                renderFunctionTable(currentData.functionTable);
            }

            function renderFlameGraph(data) {
                const container = document.getElementById('flame-graph');
                container.innerHTML = '';
                
                if (!data || !data.value) {
                    container.innerHTML = '<div style="padding: 20px; text-align: center;">No profiling data yet</div>';
                    return;
                }

                // Simple flame graph rendering
                const totalValue = data.value;
                const height = 20;
                const width = container.clientWidth;
                
                function renderNode(node, depth, xOffset, totalWidth) {
                    if (node.value === 0) return;

                    const nodeWidth = (node.value / totalValue) * totalWidth;
                    if (nodeWidth < 1) return; // Too small to render

                    const div = document.createElement('div');
                    div.className = 'flame-node';
                    div.style.left = xOffset + 'px';
                    div.style.top = (depth * height) + 'px';
                    div.style.width = nodeWidth + 'px';
                    div.style.height = height + 'px';
                    
                    // Color based on hash of name
                    const hue = hashCode(node.name) % 360;
                    div.style.backgroundColor = 'hsl(' + hue + ', 70%, 60%)';
                    
                    div.textContent = node.name;
                    div.title = node.tooltip || node.name;
                    
                    container.appendChild(div);

                    // Render children
                    if (node.children) {
                        let childXOffset = xOffset;
                        for (const child of node.children) {
                            renderNode(child, depth + 1, childXOffset, totalWidth);
                            childXOffset += (child.value / totalValue) * totalWidth;
                        }
                    }
                }

                renderNode(data, 0, 0, width);
                
                // Set container height based on depth
                const maxDepth = calculateDepth(data);
                container.style.height = (maxDepth * height + 10) + 'px';
            }

            function calculateDepth(node) {
                if (!node.children || node.children.length === 0) return 1;
                return 1 + Math.max(...node.children.map(c => calculateDepth(c)));
            }

            function hashCode(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    hash = hash & hash;
                }
                return Math.abs(hash);
            }

            function renderFunctionTable(data) {
                const tbody = document.getElementById('function-table-body');
                tbody.innerHTML = '';

                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No data</td></tr>';
                    return;
                }

                // Sort data
                const sortedData = [...data].sort((a, b) => {
                    const aVal = a[sortColumn];
                    const bVal = b[sortColumn];
                    const comparison = typeof aVal === 'string' 
                        ? aVal.localeCompare(bVal)
                        : aVal - bVal;
                    return sortDirection === 'asc' ? comparison : -comparison;
                });

                // Render rows
                for (const row of sortedData) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = \`
                        <td>\${escapeHtml(row.name)}</td>
                        <td>\${escapeHtml(row.filename)}</td>
                        <td class="number">\${row.line}</td>
                        <td class="number">\${row.selfTime}</td>
                        <td class="number">\${row.selfPercent.toFixed(2)}%</td>
                        <td class="number">\${row.totalTime}</td>
                        <td class="number">\${row.totalPercent.toFixed(2)}%</td>
                    \`;
                    tbody.appendChild(tr);
                }

                // Update sort indicators
                document.querySelectorAll('th').forEach(th => {
                    const sortKey = th.dataset.sort;
                    th.classList.remove('sort-asc', 'sort-desc');
                    const indicator = th.querySelector('.sort-indicator');
                    if (indicator) indicator.remove();
                    
                    if (sortKey === sortColumn) {
                        th.classList.add('sort-' + sortDirection);
                        const span = document.createElement('span');
                        span.className = 'sort-indicator';
                        span.textContent = sortDirection === 'asc' ? '▲' : '▼';
                        th.appendChild(span);
                    }
                });
            }

            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Event listeners
            document.getElementById('refresh-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'refresh' });
            });

            document.getElementById('clear-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'clear' });
            });

            document.querySelectorAll('th[data-sort]').forEach(th => {
                th.addEventListener('click', () => {
                    const newSortColumn = th.dataset.sort;
                    if (sortColumn === newSortColumn) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = newSortColumn;
                        sortDirection = 'desc';
                    }
                    renderFunctionTable(currentData.functionTable);
                });
            });
        })();
    </script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
