#!/bin/bash
# Script to fix duplicate type definitions in bindgen-generated Rust bindings.
#
# This script reads the generated bindings.rs file and removes duplicate type definitions
# that cause compilation errors, keeping only the first occurrence of each type.

set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <path_to_bindings.rs>"
    exit 1
fi

BINDINGS_FILE="$1"

if [ ! -f "$BINDINGS_FILE" ]; then
    echo "Error: Bindings file not found: $BINDINGS_FILE"
    exit 1
fi

echo "Fixing duplicate type definitions in: $BINDINGS_FILE"

# Create a temporary file
TEMP_FILE=$(mktemp)

# Process the file to remove duplicates
declare -A seen_types

while IFS= read -r line; do
    # Check if line is a type definition
    if [[ "$line" =~ ^pub\ type\ ([a-zA-Z_][a-zA-Z0-9_]*)\ *= ]]; then
        type_name="${BASH_REMATCH[1]}"

        if [[ -n "${seen_types[$type_name]}" ]]; then
            # Skip duplicate type definition
            echo "  Removing duplicate type definition: $type_name"
            continue
        else
            # Mark type as seen and keep the line
            seen_types[$type_name]=1
            echo "$line" >> "$TEMP_FILE"
        fi
    else
        # Keep non-type-definition lines
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$BINDINGS_FILE"

# Replace the original file with the cleaned version
mv "$TEMP_FILE" "$BINDINGS_FILE"

echo "Successfully fixed duplicate type definitions in $BINDINGS_FILE"
