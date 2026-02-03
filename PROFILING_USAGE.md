# Live Profiling Quick Start Guide

## How to Use Live Profiling

### Prerequisites
- VS Code Python Extension (this branch)
- debugpy with profiling support (vilterp/debugpy PR #1)
- Python debug configuration set up

### Step-by-Step Instructions

#### 1. Start Debugging
1. Open a Python file (e.g., `profiling_demo.py`)
2. Set a breakpoint in your code
3. Start debugging (F5 or Debug → Start Debugging)
4. Let the debugger hit your breakpoint

#### 2. Start Profiling
1. Look for the **Record button** (⏺) in the debug toolbar at the top
2. Click the record button
3. A new "Profile: [session name]" panel will open on the right side
4. The panel starts with empty data

#### 3. Continue Execution
1. Click Continue (F5) or Step Over (F10) to execute code
2. As your code runs, profiling samples are collected
3. The profile viewer updates in real-time with:
   - Updated sample count
   - Growing flame graph
   - Populated function table

#### 4. Observe Results

**Flame Graph**
- Bottom = entry point (e.g., main)
- Top = innermost executing functions
- Width = proportion of total time
- Hover for tooltip with function details

**Function Table**
- Shows all profiled functions
- Click column headers to sort:
  - By function name or file
  - By self time (time in function only)
  - By total time (time including callees)
- Percentages show relative time spent

#### 5. Stop Profiling
1. Click the **Stop button** (⏹) in the debug toolbar
2. Profiling stops collecting samples
3. View remains open with final results
4. Can clear and restart with "Clear" button in viewer

#### 6. End Debugging
- Closing the debug session automatically closes profile viewers
- Data is not persisted (future enhancement)

## Understanding the Results

### Flame Graph Interpretation

```
┌─────────────────────────────────────────┐
│              main()                      │  ← Entry point (bottom)
├─────────────────┬───────────────────────┤
│  fibonacci()    │   busy_work()         │  ← Called by main
├─────┬───────────┴───────────────────────┤
│ fib │ fib                                │  ← Recursive calls
└─────┴────────────────────────────────────┘
     ↑ Currently executing (top)
```

- **Wide bars** = more time spent
- **Tall stacks** = deep call chains
- **Horizontal position** = not meaningful (just layout)

### Function Table Metrics

- **Self Time**: Samples where function was actively executing (top of stack)
- **Total Time**: Samples where function appeared anywhere in call stack
- **Self %**: Self time as percentage of total samples
- **Total %**: Total time as percentage of total samples

Example:
```
Function    Self  Self%  Total  Total%
main()         0    0%    1000   100%    ← Never at top, but always in stack
fibonacci()  800   80%     900    90%    ← Often executing, called frequently
busy_work()  100   10%     100    10%    ← Quick, non-recursive
```

## Troubleshooting

### "No active debug session" error
- Make sure you have a debug session running
- The profiling button only appears during active debugging

### Profile viewer not opening
- Check that debugpy has profiling support
- Look for errors in Developer Tools (Help → Toggle Developer Tools)
- Check Output panel (Python extension channel)

### No data appearing
- Make sure your code is actually executing
- Check that breakpoints don't prevent execution
- Profiling interval might be too high (default is 10ms)

### Viewer shows wrong data
- Use "Clear" button to reset
- Stop and restart profiling
- Close and reopen debug session

## Tips for Best Results

1. **Profile representative workloads**: Run realistic scenarios, not trivial examples
2. **Let code execute**: Profiling needs running code, not paused breakpoints
3. **Use longer samples**: Run code for several seconds for meaningful data
4. **Focus on hot spots**: Sort by Total% to find expensive functions
5. **Check self time**: High self time = optimization target
6. **Watch for recursion**: Deep flame graphs indicate recursive calls

## Example Workflow

1. **Identify slow feature**
   - User reports "export takes too long"

2. **Set up profiling**
   - Debug the export code path
   - Start profiling before export begins

3. **Run the operation**
   - Let export complete while profiling
   - Stop profiling when done

4. **Analyze results**
   - Sort function table by Total% descending
   - Look for unexpected functions consuming time
   - Check flame graph for call patterns

5. **Optimize**
   - Target functions with high self time
   - Consider memoization for recursive functions
   - Profile again to verify improvement

## Known Limitations

- Data not persisted between sessions
- No filtering by thread (shows all threads)
- No comparison between profiling runs
- Large call stacks may overflow flame graph height
- Very short-lived functions may not appear

## Related Commands

- `Python: Start Profiling` - Start profiling current debug session
- `Python: Stop Profiling` - Stop profiling current debug session

## Feedback and Issues

Report issues or request features in the GitHub repository.
