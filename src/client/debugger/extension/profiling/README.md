# Live Profiling Feature for Python Debugger

This implementation adds live profiling support to the VS Code Python extension, consuming the profiling API from debugpy.

## Features

### 1. Debug Toolbar Integration
- **Start Profiling Button**: Record icon (⏺) appears in debug toolbar when debugging Python code
- **Stop Profiling Button**: Stop icon appears to end profiling session

### 2. Profile Viewer Panel
When profiling starts, a new panel opens showing:
- **Live Flame Graph**: Visualizes call stack hierarchy with color-coded functions
- **Sortable Function Table**: Lists all functions with:
  - Function name and source location
  - Self time (time spent in function itself)
  - Total time (time spent in function + callees)
  - Percentages for both metrics
  - Click column headers to sort by any metric

### 3. Live Updates
- Profile data updates in real-time as samples arrive from debugpy
- Flame graph and table automatically refresh with new data
- Sample count displayed at top of panel

## Architecture

### Core Components

#### 1. Profiling Service (`profilingService.ts`)
- Sends DAP `startProfiling` and `stopProfiling` requests to debugpy
- Coordinates with Profile Viewer Manager
- Handles incoming profiling samples

#### 2. Profile Viewer Manager (`profileViewerManager.ts`)
- Creates and manages webview panels for each debug session
- Aggregates incoming samples using `ProfileDataAggregator`
- Sends updates to webview via postMessage
- Cleans up panels when debug sessions end

#### 3. Profile Data Aggregator (`profileDataAggregator.ts`)
- Builds weighted call tree from stack samples
- Converts tree to flame graph format
- Generates flat function table with self/total times
- Calculates percentages based on total samples

#### 4. Profiling Event Handler (`profilingEventHandler.ts`)
- Listens for `profilingSamples` DAP events
- Routes samples to Profiling Service
- Handles debug session termination cleanup

#### 5. Profiling Commands (`profilingCommands.ts`)
- Registers `python.startProfiling` and `python.stopProfiling` commands
- Provides command palette and toolbar integration

### Data Flow

```
User clicks "Start Profiling"
    ↓
ProfilingCommands → ProfilingService → DAP Request to debugpy
    ↓
ProfileViewerManager creates webview panel
    ↓
debugpy sends profiling samples via DAP events
    ↓
ProfilingEventHandler → ProfilingService → ProfileViewerManager
    ↓
ProfileDataAggregator builds weighted tree
    ↓
Webview updates with flame graph + function table
```

## DAP Protocol

### Start Profiling Request
```typescript
session.customRequest('startProfiling', {
    interval: 0.01  // 10ms sampling interval
});
```

### Profiling Samples Event
```typescript
{
    event: 'profilingSamples',
    body: [
        {
            timestamp: number,
            threadId: number,
            frames: [
                {
                    name: string,
                    filename: string,
                    line: number,
                    module?: string
                }
            ]
        }
    ]
}
```

### Stop Profiling Request
```typescript
session.customRequest('stopProfiling', {});
```

## Stack Frame Ordering

Stack frames in samples are ordered from outermost (bottom of stack) to innermost (top of stack):
- `frames[0]`: Bottom of stack (e.g., `main()`)
- `frames[n-1]`: Top of stack (currently executing function)

This matches the visual representation in flame graphs where:
- Bottom = program entry point
- Top = currently executing code

## Flame Graph Rendering

The embedded webview uses a simple HTML/CSS/JavaScript implementation:
- Each stack frame is a colored rectangle
- Width represents proportion of total samples
- Depth represents call hierarchy
- Colors are deterministically generated from function names
- Tooltips show function name, file location, and sample counts

## Function Table

Functions are aggregated across all call paths:
- Same function appearing in different call stacks is counted together
- Self time = samples where function was at top of stack
- Total time = samples where function appeared anywhere in stack
- Percentages calculated relative to total sample count

## Testing

Comprehensive unit tests cover:
- Empty sample handling
- Single sample aggregation
- Multiple samples with same/different stacks
- Nested function call handling
- Percentage calculations
- Flame graph data structure generation

Run tests:
```bash
npm run test:unittests -- --grep "Profile Data Aggregator"
```

## Future Enhancements

Potential improvements:
1. Save/export profile data to file
2. Compare multiple profiling sessions
3. Filter by thread ID
4. Zoom and navigation in flame graph
5. Integration with react-flame-graph library for richer UI
6. CPU vs wall-clock time modes
7. Call graph visualization
8. Hot path highlighting
