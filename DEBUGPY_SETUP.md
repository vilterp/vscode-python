# Using a Custom debugpy Version

This guide explains how to use a custom version of debugpy (such as [vilterp/debugpy#1](https://github.com/vilterp/debugpy/pull/1) with profiling support) with the VS Code Python extension.

## Overview

The VS Code Python extension uses debugpy through the separate `ms-python.debugpy` extension. The debugpy extension typically bundles its own version of debugpy, but it can also detect and use debugpy installed in your Python environment.

### How debugpy is Resolved

The `ms-python.debugpy` extension determines which debugpy to use with the following priority:

1. **`debugAdapterPath` in launch.json** - If specified, this path is used directly (highest priority)
2. **debugpy in active Python environment** - The extension checks if debugpy is installed in the currently selected Python interpreter
3. **Bundled debugpy** - If not found in the environment, it falls back to the version bundled with the `ms-python.debugpy` extension

This means that **installing debugpy in your Python environment will cause it to be used automatically**, making Method 1 below the simplest approach for testing custom versions.

## Quick Start (For Testing Profiling)

If you just want to test the profiling feature with the custom debugpy:

```bash
# 1. Install the custom debugpy in your Python environment
pip install git+https://github.com/vilterp/debugpy.git@profiling-support

# 2. Verify installation
python -c "import debugpy; print(debugpy.__version__, debugpy.__file__)"

# 3. Start debugging - the extension will automatically use this debugpy
```

The `ms-python.debugpy` extension will detect and use the debugpy installed in your active Python environment, giving it priority over its bundled version.

## Method 1: Install in Python Environment (Recommended)

This is the simplest approach and works because the `ms-python.debugpy` extension checks the active Python environment for debugpy before using its bundled version.

### Why This Works

The debugpy extension follows this resolution order:
1. Checks if debugpy is importable in the selected Python environment
2. If found, uses that version
3. If not found, falls back to the bundled debugpy

This means any debugpy installed via `pip install` in your active environment will be automatically detected and used.

### Steps

1. **Install custom debugpy in your Python environment:**

   ```bash
   # From GitHub (using a specific branch/PR)
   pip install git+https://github.com/vilterp/debugpy.git@profiling-support
   
   # Or from a local clone
   cd /path/to/debugpy
   pip install -e .
   ```

2. **Verify the installation:**

   ```bash
   python -c "import debugpy; print('debugpy location:', debugpy.__file__)"
   ```

   This should show the path to your custom debugpy installation.

3. **Select this Python environment in VS Code:**

   - Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Run "Python: Select Interpreter"
   - Choose the environment where you installed custom debugpy

4. **Start debugging:**

   The `ms-python.debugpy` extension will detect and use the debugpy from your selected Python environment, giving it priority over the bundled version.

### Verification

To confirm the custom debugpy is being used:

1. Start a debug session
2. Check the Debug Console - you should see output like:
   ```
   DAP Server launched with command: python /path/to/your/custom/debugpy/adapter ...
   ```

## Method 2: Use debugAdapterPath in launch.json (Advanced)

This method gives you explicit control over which debugpy to use, regardless of your Python environment.

### Steps

1. **Install custom debugpy somewhere:**

   ```bash
   # Clone and install in a specific location
   git clone https://github.com/vilterp/debugpy.git /opt/custom-debugpy
   cd /opt/custom-debugpy
   pip install -e .
   ```

2. **Find the adapter path:**

   ```bash
   python -c "import debugpy, os; print(os.path.join(os.path.dirname(debugpy.__file__), 'adapter'))"
   ```

   This will output something like: `/opt/custom-debugpy/src/debugpy/adapter`

3. **Add to your launch.json:**

   ```json
   {
       "version": "0.2.0",
       "configurations": [
           {
               "name": "Python: Current File (Custom debugpy)",
               "type": "python",
               "request": "launch",
               "program": "${file}",
               "console": "integratedTerminal",
               "debugAdapterPath": "/opt/custom-debugpy/src/debugpy/adapter"
           }
       ]
   }
   ```

4. **Launch using this configuration**

### Benefits
- Works regardless of which Python environment is selected
- Useful when testing multiple debugpy versions
- Good for development and testing scenarios

### Drawbacks
- Requires manual configuration
- Path must be updated if debugpy moves
- Different for each workspace

## Method 3: Custom ms-python.debugpy Extension (Expert)

For advanced users who want to package a custom debugpy as an extension.

### Overview

The `ms-python.debugpy` extension bundles debugpy and exposes it to the Python extension. You can build your own version of this extension with a custom debugpy.

### Steps

1. **Clone the debugpy extension:**

   ```bash
   git clone https://github.com/microsoft/vscode-python-debugger
   cd vscode-python-debugger
   ```

2. **Replace bundled debugpy:**

   ```bash
   # Remove existing debugpy
   rm -rf bundled/libs/debugpy*
   
   # Install your custom version
   pip install --target bundled/libs git+https://github.com/vilterp/debugpy.git@profiling-support
   ```

3. **Build the extension:**

   ```bash
   npm install
   npm run package
   ```

   This creates a `.vsix` file.

4. **Install in VS Code:**

   - Open VS Code
   - Go to Extensions view
   - Click "..." menu → "Install from VSIX"
   - Select the generated `.vsix` file
   - Restart VS Code

### Benefits
- Clean integration with VS Code
- No per-workspace configuration needed
- Matches the standard extension architecture

### Drawbacks
- Most complex approach
- Requires rebuilding when debugpy changes
- Need to manage extension updates separately

## Understanding debugpy Resolution Order

This section clarifies how the VS Code Python debugging system determines which debugpy to use.

### The Resolution Process

When you start a debug session, the Python extension queries the `ms-python.debugpy` extension for the debugpy path. The debugpy extension uses the following priority order:

1. **Explicit `debugAdapterPath` setting** (highest priority)
   - If you specify `debugAdapterPath` in your launch.json configuration
   - This path is used directly, overriding all other options
   - Use case: Testing specific debugpy versions or comparing multiple installations

2. **debugpy in active Python environment** (second priority)
   - The extension checks if debugpy is importable in your selected Python interpreter
   - If found via `import debugpy`, that installation is used
   - Use case: Most common for development and testing custom versions

3. **Bundled debugpy in ms-python.debugpy extension** (fallback)
   - If debugpy is not found in the environment and no path is specified
   - The extension uses its internally bundled debugpy
   - Use case: Default behavior for most users

### Key Insight

**Yes, the debugpy extension does check the virtual environment first!** Before falling back to its bundled version, it attempts to import debugpy from the active Python environment. This is why Method 1 (installing in your Python environment) works seamlessly.

### How to Verify Which debugpy is Being Used

1. **Check Python environment:**
   ```bash
   python -c "import debugpy; print('Version:', debugpy.__version__); print('Location:', debugpy.__file__)"
   ```

2. **Check Debug Console during debugging:**
   - Start a debug session
   - Look for "DAP Server launched with command:" message
   - The path will show which debugpy is being used

3. **Expected output:**
   - Custom environment: `/path/to/venv/lib/python3.x/site-packages/debugpy/adapter`
   - Bundled: `/path/to/.vscode/extensions/ms-python.debugpy-x.x.x/bundled/libs/debugpy/adapter`

### Important Notes

- The resolution happens at debug session start time
- Changing Python interpreters will change which debugpy is used
- The bundled debugpy is only used as a fallback if no debugpy is found in the environment
- This behavior makes testing custom debugpy versions straightforward: just install it in your environment

## Troubleshooting

### Extension uses wrong debugpy

**Symptom:** Profiling doesn't work, or you see unexpected debugpy behavior.

**Solutions:**

1. **Verify Python environment:**
   ```bash
   # In VS Code terminal
   python -c "import debugpy; print(debugpy.__file__)"
   ```
   
   Make sure this points to your custom installation.

2. **Check Debug Console output:**
   - Start debugging
   - Look for "DAP Server launched with command:" message
   - Verify the path includes your custom debugpy

3. **Force environment selection:**
   - Open Command Palette
   - Run "Python: Select Interpreter"
   - Explicitly choose the right environment

### debugAdapterPath not working

**Symptom:** Configuration with `debugAdapterPath` is ignored.

**Solutions:**

1. **Use absolute path:**
   ```json
   "debugAdapterPath": "/absolute/path/to/debugpy/adapter"
   ```

2. **Verify path exists:**
   ```bash
   ls -la /path/to/debugpy/adapter
   ```
   
   The `adapter` directory should exist and contain `__main__.py`.

3. **Check Python can import:**
   ```bash
   cd /path/to/debugpy/adapter
   python -c "import __main__"
   ```

### Profiling still not available

**Symptom:** Custom debugpy installed but profiling features don't appear.

**Checklist:**

1. ✅ Custom debugpy installed and verified
2. ✅ Python extension can find custom debugpy
3. ✅ Debug session starts successfully
4. ✅ Check debugpy supports profiling:
   ```bash
   python -c "import debugpy.adapter; print(dir(debugpy.adapter))"
   ```

If all checks pass but profiling still doesn't work:
- Check the debugpy version supports the profiling API
- Verify the VS Code extension has profiling support (this branch)
- Look for errors in Output → Python, Debug Console, or Developer Tools

## Platform-Specific Notes

### Windows

- Use forward slashes or escaped backslashes in paths:
  ```json
  "debugAdapterPath": "C:/path/to/debugpy/adapter"
  // or
  "debugAdapterPath": "C:\\path\\to\\debugpy\\adapter"
  ```

### macOS/Linux

- If using virtual environments, ensure you activate the right one:
  ```bash
  source /path/to/venv/bin/activate
  pip install git+https://github.com/vilterp/debugpy.git@profiling-support
  ```

### Docker/Remote Development

When using Dev Containers or Remote SSH:

1. Install custom debugpy **inside** the container/remote environment
2. The extension forwards debugger requests automatically
3. Use Method 1 (install in environment) for simplest setup

## Testing Your Setup

### Quick Test Script

Create `test_debugpy.py`:

```python
#!/usr/bin/env python3
"""Test script to verify custom debugpy is working"""

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print("Testing custom debugpy...")
    
    # Set a breakpoint on the next line
    result = fibonacci(10)
    
    print(f"Result: {result}")
    print("If debugger stopped here, custom debugpy is working!")

if __name__ == "__main__":
    main()
```

### Test Procedure

1. Open `test_debugpy.py` in VS Code
2. Set a breakpoint on line with `result = fibonacci(10)`
3. Start debugging (F5)
4. Debugger should stop at breakpoint
5. Check Debug Console for debugpy path
6. If using profiling branch, click ⏺ button in debug toolbar
7. Profile viewer should open

## For Profiling Feature Testing

When specifically testing the profiling feature:

1. **Install profiling-enabled debugpy:**
   ```bash
   pip install git+https://github.com/vilterp/debugpy.git@profiling-support
   ```

2. **Verify profiling support:**
   ```bash
   python -c "import debugpy; print('Profiling support:', hasattr(debugpy, 'profiling'))"
   ```

3. **Use the demo script:**
   ```bash
   # From this repository
   python profiling_demo.py
   ```

4. **Debug the demo:**
   - Open profiling_demo.py
   - Start debugging (F5)
   - Click ⏺ (Record) button in debug toolbar
   - Click Continue to run code
   - Watch profile viewer populate with live data

## Summary

### Resolution Order Recap

The `ms-python.debugpy` extension resolves debugpy in this order:
1. ✅ **`debugAdapterPath` in launch.json** (if specified)
2. ✅ **debugpy in active Python environment** (checked via import)
3. ✅ **Bundled debugpy** (fallback)

This means **installing debugpy in your environment takes priority over the bundled version**, making Method 1 the simplest approach.

### Recommended Approaches

**For quick testing (Recommended):**
- Use Method 1: Install in Python environment
- Simple `pip install` command
- Automatically detected and prioritized over bundled version
- Works immediately with VS Code

**For development:**
- Use Method 2: debugAdapterPath in launch.json
- Explicit control over debugpy version
- Easy to switch between versions
- Highest priority, overrides environment detection

**For production/distribution:**
- Use Method 3: Custom extension build
- Cleanest user experience
- More work to set up and maintain
- Good for packaging specific debugpy versions

## Frequently Asked Questions

### Does the debugpy extension check my virtual environment first?

**Yes!** The `ms-python.debugpy` extension checks if debugpy is installed in your active Python environment before falling back to its bundled version. This is why simply installing debugpy with `pip install` in your virtual environment works automatically.

### Do I need to configure anything for it to use my environment's debugpy?

**No configuration needed!** As long as:
1. You have debugpy installed in your Python environment
2. That environment is selected in VS Code (via "Python: Select Interpreter")
3. You start a debug session

The extension will automatically detect and use your environment's debugpy.

### What if I have debugpy installed but it's still using the bundled version?

Check these common issues:
1. **Wrong environment selected** - Make sure the correct Python interpreter is active
2. **debugpy not actually installed** - Run `python -c "import debugpy; print(debugpy.__file__)"`
3. **Old VS Code cache** - Try reloading VS Code window

### Can I force a specific debugpy version?

Yes, use `debugAdapterPath` in your launch.json configuration. This overrides both environment detection and bundled version.

### Does this work with virtual environments, conda, poetry, etc.?

Yes! As long as you:
1. Install debugpy in that environment
2. Select that environment in VS Code

The extension will detect it regardless of which environment manager you use (venv, conda, poetry, pipenv, etc.).

## Additional Resources

- [debugpy GitHub](https://github.com/microsoft/debugpy)
- [VS Code Python Debugging](https://code.visualstudio.com/docs/python/debugging)
- [Profiling Feature Documentation](./PROFILING_USAGE.md)
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
