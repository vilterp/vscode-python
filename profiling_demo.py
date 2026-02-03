#!/usr/bin/env python3
"""
Example Python script for testing live profiling feature.

Run this script with debugging enabled, then click the "Start Profiling" 
button in the debug toolbar to see live profiling data.
"""

import time


def fibonacci(n):
    """Compute fibonacci number recursively (slow on purpose)"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def compute_fibonacci_sequence(count):
    """Compute multiple fibonacci numbers"""
    results = []
    for i in range(count):
        results.append(fibonacci(i))
    return results


def busy_work():
    """Do some busy work"""
    total = 0
    for i in range(1000000):
        total += i
    return total


def mixed_workload():
    """Mix of different operations"""
    # Some computation
    result1 = busy_work()
    
    # Some fibonacci
    result2 = compute_fibonacci_sequence(15)
    
    # Some I/O simulation
    time.sleep(0.1)
    
    return result1, result2


def main():
    """Main entry point"""
    print("Starting profiling demo...")
    print("Set a breakpoint here and start debugging.")
    print("Then click 'Start Profiling' in the debug toolbar.")
    
    # Do some work that will show up in the profiler
    for iteration in range(5):
        print(f"\nIteration {iteration + 1}")
        
        # Call various functions
        fib_results = compute_fibonacci_sequence(20)
        print(f"  Fibonacci: {fib_results[:10]}...")
        
        work_result = busy_work()
        print(f"  Busy work result: {work_result}")
        
        mixed_result = mixed_workload()
        print(f"  Mixed workload completed")
        
        # Small delay
        time.sleep(0.5)
    
    print("\nDemo completed!")


if __name__ == "__main__":
    main()
