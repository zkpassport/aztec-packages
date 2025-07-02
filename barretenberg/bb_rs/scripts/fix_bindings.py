#!/usr/bin/env python3
"""
Script to fix duplicate type definitions in bindgen-generated Rust bindings.

This script reads the generated bindings.rs file and removes duplicate type definitions
that cause compilation errors, keeping only the first occurrence of each type.
"""

import sys
import re
import os

def fix_duplicate_types(bindings_file_path):
    """
    Remove duplicate type definitions from the bindings file.

    Args:
        bindings_file_path: Path to the bindings.rs file to fix
    """
    print(f"Fixing duplicate type definitions in: {bindings_file_path}")

    if not os.path.exists(bindings_file_path):
        print(f"Error: Bindings file not found: {bindings_file_path}")
        return False

    try:
        # Read the file
        with open(bindings_file_path, 'r') as f:
            content = f.read()

        # Track seen type definitions
        seen_types = set()
        lines = content.split('\n')
        cleaned_lines = []

        # Pattern to match type definitions like: pub type <name> = <definition>;
        type_def_pattern = re.compile(r'^pub type\s+(\w+)\s*=')

        for line in lines:
            match = type_def_pattern.match(line.strip())

            if match:
                type_name = match.group(1)
                if type_name in seen_types:
                    # Skip this duplicate type definition
                    print(f"  Removing duplicate type definition: {type_name}")
                    continue
                else:
                    # Keep this type definition and mark it as seen
                    seen_types.add(type_name)
                    cleaned_lines.append(line)
            else:
                # Keep non-type-definition lines
                cleaned_lines.append(line)

        # Write the cleaned content back
        cleaned_content = '\n'.join(cleaned_lines)
        with open(bindings_file_path, 'w') as f:
            f.write(cleaned_content)

        print(f"Successfully fixed duplicate type definitions in {bindings_file_path}")
        return True

    except Exception as e:
        print(f"Error fixing bindings file: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: fix_bindings.py <path_to_bindings.rs>")
        sys.exit(1)

    bindings_file = sys.argv[1]

    if fix_duplicate_types(bindings_file):
        print("Bindings file fixed successfully!")
        sys.exit(0)
    else:
        print("Failed to fix bindings file!")
        sys.exit(1)

if __name__ == "__main__":
    main()
