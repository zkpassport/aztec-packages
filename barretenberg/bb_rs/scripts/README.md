# Bindgen Fix Scripts

This directory contains scripts to fix issues with the generated Rust bindings from bindgen.

## Problem

When bindgen processes the C++ header files, it can generate duplicate type definitions due to multiple header files defining the same type aliases (like `out_buf`, `vec_out_buf`, `in_buf`, etc.). This causes Rust compilation errors like:

```
error[E0428]: the name `out_buf` is defined multiple times
```

## Solution

The scripts in this directory automatically fix the generated `bindings.rs` file by removing duplicate type definitions, keeping only the first occurrence of each type.

## Scripts

### `fix_bindings.py`

Python 3 script that processes the bindings file and removes duplicates.

**Usage:**

```bash
python3 fix_bindings.py path/to/bindings.rs
```

### `fix_bindings.sh`

Bash script that does the same thing as the Python script, for environments where Python might not be available.

**Usage:**

```bash
bash fix_bindings.sh path/to/bindings.rs
```

## Integration

The scripts are automatically called by the `build.rs` build script after bindgen generates the bindings. The build process will:

1. Try to run the Python script first
2. Fall back to the shell script if Python is not available
3. Continue with the build if both fail (with warnings)

## Manual Usage

You can also run these scripts manually on any generated bindings file:

```bash
# Using Python
./scripts/fix_bindings.py target/debug/build/bb_rs-*/out/bindings.rs

# Using shell script
./scripts/fix_bindings.sh target/debug/build/bb_rs-*/out/bindings.rs
```

## What Gets Fixed

The scripts identify and remove duplicate lines like:

```rust
pub type out_buf = *mut u8;
pub type out_buf = *mut u8;  // <- This duplicate gets removed
pub type in_buf = *const u8;
pub type in_buf = *const u8;  // <- This duplicate gets removed
```

Only the first occurrence of each type definition is kept.
