# Using a Custom debugpy Version

This guide explains how to use a custom version of debugpy (such as [vilterp/debugpy#1](https://github.com/vilterp/debugpy/pull/1) with profiling support) with the VS Code Python extension.

## Overview

The VS Code Python extension uses debugpy through the separate `ms-python.debugpy` extension. To use a custom debugpy version, you have several options depending on your use case.

## Quick Start (For Testing Profiling)

If you just want to test the profiling feature with the custom debugpy:

```bash
# 1. Install the custom debugpy in your Python environment
pip install git+https://github.com/vilterp/debugpy.git@profiling-support

# 2. Verify installation
python -c "import debugpy; print(debugpy.__version__, debugpy.__file__)"

# 3. Start debugging - the extension will use this debugpy
```

The extension will automatically find debugpy installed in your active Python environment.

## Method 1: Install in Python Environment (Recommended)

This is the simplest approach and works well for testing.

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

   The extension will automatically use the debugpy from your selected Python environment.

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

**For quick testing (Recommended):**
- Use Method 1: Install in Python environment
- Simple `pip install` command
- Works immediately with VS Code

**For development:**
- Use Method 2: debugAdapterPath in launch.json
- Explicit control over debugpy version
- Easy to switch between versions

**For production/distribution:**
- Use Method 3: Custom extension build
- Cleanest user experience
- More work to set up and maintain

## Additional Resources

- [debugpy GitHub](https://github.com/microsoft/debugpy)
- [VS Code Python Debugging](https://code.visualstudio.com/docs/python/debugging)
- [Profiling Feature Documentation](./PROFILING_USAGE.md)
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
