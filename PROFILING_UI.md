# Live Profiling UI Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VS Code - profiling_demo.py                                        [- □ X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ File Edit Selection View Go Run Terminal Help                              │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ EXPLORER      │ profiling_demo.py                                    ▼ ⚙    │
│               ├─────────────────────────────────────────────────────────────┤
│ 📁 workspace  │  1  #!/usr/bin/env python3                                  │
│  📄 test.py   │  2  """Example for testing live profiling"""                │
│  📄 profile...│  3                                                           │
│               │  4  def fibonacci(n):                                        │
│               │  5      if n <= 1:                                          │
│ DEBUG         │  6          return n                                         │
│ • Paused      │  7      return fibonacci(n-1) + fibonacci(n-2)              │
│               │  8                                                           │
│ Call Stack    │  9  def main():                                             │
│ > main        │ 10  ●   print("Starting...")  ← breakpoint hit              │
│   <module>    │ 11      result = fibonacci(20)                              │
│               │ 12      print(f"Result: {result}")                          │
│ Variables     │                                                              │
│ ▼ Locals      │                                                              │
│   iteration:0 │                                                              │
├───────────────┴─────────────────────────────────────────────────────────────┤
│ DEBUG CONSOLE                                                                │
│ > Debugger attached                                                          │
│ > Starting profiling...                                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DEBUG TOOLBAR (floating)                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ▶ Continue  ⤴ Step Over  ⤵ Step Into  ⤴ Step Out  ↻ Restart  ⏹ Stop      │
│                                                      ⏺ Profile  ⏹ Stop Prof │
│                                                      └────┬────┘             │
│                                                   NEW BUTTONS!               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Profile: Python                                                   [- □ X]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Total Samples: 1,247          [Refresh] [Clear]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ FLAME GRAPH                                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ████████████████████████████ main() ██████████████████████████████████│ │
│ │ ████████████ fibonacci() █████████████████ busy_work() ████████████████│ │
│ │ ████ fib █████ fib ████ fib ████                                        │ │
│ │ ██ fib ████ fib                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ FUNCTION TABLE                                                               │
│ ┌───────────┬──────────────┬──────┬──────┬────────┬───────┬─────────┐     │
│ │ Function▼ │ File         │ Line │ Self │ Self % │ Total │ Total % │     │
│ ├───────────┼──────────────┼──────┼──────┼────────┼───────┼─────────┤     │
│ │fibonacci  │profile_de... │  4   │  892 │ 71.5%  │ 1,105 │  88.6% │ ← Hot│
│ │busy_work  │profile_de... │ 15   │  120 │  9.6%  │   120 │   9.6% │     │
│ │main       │profile_de... │ 27   │    0 │  0.0%  │ 1,247 │ 100.0% │     │
│ │mixed_...  │profile_de... │ 21   │   10 │  0.8%  │   142 │  11.4% │     │
│ │compute... │profile_de... │ 10   │   22 │  1.8%  │ 1,127 │  90.4% │     │
│ └───────────┴──────────────┴──────┴──────┴────────┴───────┴─────────┘     │
│                                                                              │
│ ▲ Sort by any column                                                         │
└──────────────────────────────────────────────────────────────────────────────┘

KEY FEATURES:
✓ Record button appears in debug toolbar (only when debugging)
✓ Profile viewer opens automatically when profiling starts
✓ Flame graph shows call hierarchy (bottom = entry, top = hot code)
✓ Function table sortable by any column
✓ Real-time updates as samples arrive
✓ Viewer auto-closes when debug session ends
✓ Colors are deterministic (same function = same color)
✓ Hover tooltips on flame graph bars
```

## UI Elements Explained

### Debug Toolbar Additions
- **⏺ Start Profiling**: Appears when debug session is active
- **⏹ Stop Profiling**: Replaces start button when profiling is active
- Icons use VS Code's built-in Codicons (record, debug-stop)

### Profile Viewer Panel
1. **Header Bar**
   - Shows session name
   - Displays total sample count
   - Refresh/Clear buttons for manual control

2. **Flame Graph Section**
   - Visual call stack representation
   - Width = proportion of total time
   - Height = call depth
   - Colored bars with hover tooltips
   - Click to zoom (future enhancement)

3. **Function Table Section**
   - All profiled functions listed
   - Sortable columns (click headers)
   - Self vs Total time comparison
   - Percentage calculations
   - File and line number for navigation

### Color Coding
- Each function gets deterministic color (hash of name)
- Same function across different call paths = same color
- Helps identify hot functions quickly
- High contrast for visibility

### Interaction Model
1. User starts debugging → toolbar appears
2. User clicks record → viewer opens
3. Code executes → data streams in
4. Viewer updates live → user sees results
5. User clicks stop → profiling ends
6. Debug ends → viewer closes automatically
