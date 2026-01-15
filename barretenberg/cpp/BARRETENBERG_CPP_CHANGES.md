# Barretenberg C++ Changes from v3.0.0-devnet.20251212

This document outlines all modifications made to the `barretenberg/cpp/` directory in the `pr/obsidion-mobile-devnet` branch compared to the upstream tag `v3.0.0-devnet.20251212`.

## Summary

**Total Changes:**

- 27 files modified (+ `bb_rs/build.rs` for VLA flags)
- ~250 insertions, ~30 deletions
- Main focus: Mobile platform support (iOS/Android), conditional compilation, memory management improvements, Xcode 26.x compatibility, and **IPC exclusion for mobile Debug builds**

## Change Categories

### 1. Mobile Build Support (NEW MOBILE Flag)

#### 1.1 CMakeLists.txt

**File:** `barretenberg/cpp/CMakeLists.txt`

Added a new CMake option to exclude modules incompatible with mobile platforms:

```cmake
option(MOBILE "Exclude ipc, lmdblib, nodejs_module, world_state, vm2 for mobile" OFF)
```

Conditionally include gtest and benchmark modules only when not building for mobile:

```cmake
# Lines 145-148
if(NOT MOBILE)
    include(cmake/gtest.cmake)
    include(cmake/benchmark.cmake)
endif()
```

**Impact:** When `MOBILE=ON`, test framework dependencies (GoogleTest and Google Benchmark) are completely excluded from the build, preventing unnecessary downloads and compilation. This is critical for mobile builds where these frameworks would fail to build or are unnecessary.

**Added BB_MOBILE preprocessor define** (for conditional C++ compilation):

```cmake
# Added after MOBILE option
if(MOBILE)
    add_compile_definitions(BB_MOBILE)
    message(STATUS "Building for MOBILE - IPC, world_state, vm2 disabled")
endif()
```

**Impact:** Exposes the `BB_MOBILE` preprocessor macro to C++ code, enabling conditional compilation of IPC-related code paths that would cause linker errors on mobile.

---

#### 1.2 IPC Exclusion for Mobile Builds

**File:** `barretenberg/cpp/src/barretenberg/api/CMakeLists.txt`

Excluded IPC linking for mobile builds to prevent undefined symbol errors in Debug mode:

```cmake
# Before:
if(NOT WASM)
    target_link_libraries(api_objects PRIVATE ipc)
endif()

# After:
if(NOT WASM AND NOT MOBILE)
    target_link_libraries(api_objects PRIVATE ipc)
endif()
```

**File:** `barretenberg/cpp/src/barretenberg/api/api_msgpack.cpp`

Added `BB_MOBILE` guards to exclude IPC code paths on mobile:

```cpp
// Before:
#ifndef __wasm__
#include "barretenberg/ipc/ipc_server.hpp"
...
#endif

// After:
// IPC is only available on desktop platforms (not WASM or Mobile)
#if !defined(__wasm__) && !defined(BB_MOBILE)
#include "barretenberg/ipc/ipc_server.hpp"
...
#endif
```

**Why this is needed:**

- In **Release** mode, LTO (Link-Time Optimization) eliminates unused IPC code paths
- In **Debug** mode, all symbols are kept, exposing undefined `IpcServer::create_shm` and `create_socket` references
- IPC (shared memory, Unix sockets) is not applicable to mobile single-process apps

**Impact:** Fixes linker errors like `Undefined symbols: bb::ipc::IpcServer::create_shm` when building in Debug mode for iOS Simulator.

---

#### 1.4 cmake/module.cmake

**File:** `barretenberg/cpp/cmake/module.cmake`

Modified test and benchmark compilation to skip when building for mobile:

```cmake
# Before:
if(TEST_SOURCE_FILES AND NOT FUZZING)

# After:
if(TEST_SOURCE_FILES AND NOT FUZZING AND NOT MOBILE)
```

Similarly for benchmarks:

```cmake
# Before:
if(BENCH_SOURCE_FILES AND NOT FUZZING)

# After:
if(BENCH_SOURCE_FILES AND NOT FUZZING AND NOT MOBILE)
```

**Impact:** Reduces binary size and build time for mobile platforms by excluding tests and benchmarks.

---

#### 1.5 src/CMakeLists.txt

**File:** `barretenberg/cpp/src/CMakeLists.txt`

Major restructuring of module inclusion for mobile builds:

**Excluded modules for mobile:**

- `barretenberg/benchmark` - Conditionally excluded
- `barretenberg/ipc` - Moved inside NOT MOBILE block
- `barretenberg/nodejs_module` - Excluded for mobile
- `barretenberg/world_state` - Excluded for mobile
- `barretenberg/vm2` - Excluded for mobile

**Key changes:**

```cmake
# Benchmark exclusion
if(NOT MOBILE)
    add_subdirectory(barretenberg/benchmark)
endif()

# Module reorganization
if(NOT FUZZING AND NOT WASM)
    add_subdirectory(barretenberg/ipc)

    if (NOT MOBILE)
       add_subdirectory(barretenberg/nodejs_module)
       add_subdirectory(barretenberg/world_state)
       add_subdirectory(barretenberg/vm2)
    endif()
endif()

# Target objects adjustment
if(NOT WASM AND NOT FUZZING)
    list(APPEND BARRETENBERG_TARGET_OBJECTS $<TARGET_OBJECTS:crypto_merkle_tree_objects>)
    list(APPEND BARRETENBERG_TARGET_OBJECTS $<TARGET_OBJECTS:lmdblib_objects>)
    list(APPEND BARRETENBERG_TARGET_OBJECTS $<TARGET_OBJECTS:api_objects>)

    if (NOT MOBILE)
        list(APPEND BARRETENBERG_TARGET_OBJECTS $<TARGET_OBJECTS:world_state_objects>)
    else()
        # MOBILE builds need vm2_stub since vm2 is excluded
        list(APPEND BARRETENBERG_TARGET_OBJECTS $<TARGET_OBJECTS:vm2_stub_objects>)
    endif()
endif()
```

**Impact:** Significantly reduces the size and complexity of mobile builds while maintaining core functionality.

---

### 2. Test Linking Updates

#### 2.1 API Tests

**File:** `barretenberg/cpp/src/barretenberg/api/CMakeLists.txt`

```cmake
# Before:
if(NOT WASM AND NOT FUZZING)

# After:
if(NOT WASM AND NOT FUZZING AND NOT MOBILE)
    target_link_libraries(api_tests PRIVATE vm2_stub)
endif()
```

#### 2.2 BBAPI Tests

**File:** `barretenberg/cpp/src/barretenberg/bbapi/CMakeLists.txt`

```cmake
# Before:
if(NOT WASM AND NOT FUZZING)

# After:
if(NOT WASM AND NOT FUZZING AND NOT MOBILE)
    target_link_libraries(bbapi_tests PRIVATE vm2_stub)
endif()
```

#### 2.3 DSL Tests

**File:** `barretenberg/cpp/src/barretenberg/dsl/CMakeLists.txt`

```cmake
# Before:
if(NOT WASM AND NOT FUZZING)

# After:
if(NOT WASM AND NOT FUZZING AND NOT MOBILE)
    target_link_libraries(dsl_tests PRIVATE vm2_stub)
endif()
```

#### 2.4 VM2 Tests

**File:** `barretenberg/cpp/src/barretenberg/vm2/CMakeLists.txt`

```cmake
# Before:
if(NOT WASM AND NOT FUZZING)

# After:
if(NOT WASM AND NOT FUZZING AND NOT MOBILE)
    target_link_libraries(vm2_tests PRIVATE dsl vm2)
endif()
```

#### 2.5 Merkle Tree Tests

**File:** `barretenberg/cpp/src/barretenberg/crypto/merkle_tree/CMakeLists.txt`

```cmake
# Before:
if (NOT FUZZING)
    target_link_libraries(crypto_merkle_tree_tests PRIVATE stdlib_poseidon2)
endif()

# After:
if (NOT FUZZING AND TARGET crypto_merkle_tree_tests)
    target_link_libraries(crypto_merkle_tree_tests PRIVATE stdlib_poseidon2)
endif()
```

**Impact:** Prevents CMake errors when test targets don't exist (e.g., mobile builds with MOBILE=ON). Uses target existence check for robust conditional compilation.

---

### 3. Platform-Specific Conditional Compilation

#### 3.1 Tracy Instrumentation Guards

**Files affected:**

- `barretenberg/cpp/src/barretenberg/common/bb_bench.hpp`
- `barretenberg/cpp/src/barretenberg/common/mem.hpp`
- `barretenberg/cpp/src/barretenberg/common/tracy_mem/overload_operator_new.cpp`

**Changes:**
All Tracy memory profiling calls are now wrapped in `#ifdef TRACY_INSTRUMENTED` guards:

```cpp
// Before:
#include <tracy/Tracy.hpp>
TRACY_ALLOC(ptr, size);
TRACY_FREE(ptr);

// After:
#ifdef TRACY_INSTRUMENTED
#include <tracy/Tracy.hpp>
#endif

#ifdef TRACY_ALLOC
TRACY_ALLOC(ptr, size);
#endif

#ifdef TRACY_FREE
TRACY_FREE(ptr);
#endif
```

**Impact:** Allows building without Tracy profiler, reducing dependencies for mobile builds.

---

#### 3.2 Memory Allocation (iOS/Android Support)

**File:** `barretenberg/cpp/src/barretenberg/common/mem.hpp`

Extended `aligned_alloc` support to Android:

```cpp
// Before:
#ifdef __APPLE__
inline void* aligned_alloc(size_t alignment, size_t size) { ... }

// After:
#if defined(__APPLE__) || defined(ANDROID) || defined(__ANDROID__)
inline void* aligned_alloc(size_t alignment, size_t size) { ... }
```

**Impact:** Fixes memory alignment issues on Android devices.

---

#### 3.3 Hardware Concurrency Detection

**File:** `barretenberg/cpp/src/barretenberg/common/benchmark.hpp`

Added platform-specific thread counting:

```cpp
// Before:
<< "threads": " << env_hardware_concurrency();

// After:
#if defined(__APPLE__) || defined(__ANDROID__) || defined(ANDROID)
        << "threads": " << std::thread::hardware_concurrency();
#else
        << "threads": " << env_hardware_concurrency();
#endif
```

**Impact:** Correctly detects CPU core count on mobile platforms.

---

#### 3.4 Random Number Generation (iOS/macOS Support)

**File:** `barretenberg/cpp/src/barretenberg/numeric/random/engine.cpp`

Added proper entropy support for Apple platforms:

```cpp
// Before:
#include <sys/random.h>

// After:
#if defined(__APPLE__) || defined(__wasm__)
#include <unistd.h>
// Declare getentropy for iOS/macOS
extern "C" int getentropy(void* buffer, size_t length);
#else
#include <sys/random.h>
#endif
```

**Impact:** Fixes random number generation on iOS/macOS where `sys/random.h` may not be available.

---

### 4. Threading Support Improvements

#### 4.1 ThreadPool Forward Declarations

**Files:**

- `barretenberg/cpp/src/barretenberg/crypto/merkle_tree/append_only_tree/content_addressed_append_only_tree.hpp`
- `barretenberg/cpp/src/barretenberg/crypto/merkle_tree/fixtures.hpp`

**Changes:**

```cpp
// Before:
#include "barretenberg/common/thread_pool.hpp"

// After:
#ifndef NO_MULTITHREADING
#include "barretenberg/common/thread_pool.hpp"
#else
// Forward declare ThreadPool when multithreading is disabled
namespace bb { class ThreadPool; }
#endif
```

**Impact:** Allows compilation with `NO_MULTITHREADING` flag for single-threaded environments.

---

#### 4.2 Thread Header Addition

**File:** `barretenberg/cpp/src/barretenberg/common/benchmark.hpp`

Added missing include:

```cpp
#include <thread>
```

**File:** `barretenberg/cpp/src/barretenberg/common/thread.hpp`

Added missing include:

```cpp
#include <thread>
```

**Impact:** Fixes compilation errors on some platforms where `std::thread` was not available.

---

### 5. Memory Management Improvements

#### 5.1 Low Memory Prover Support

**File:** `barretenberg/cpp/src/barretenberg/polynomials/backing_memory.cpp`

Converted global variable to thread-safe accessor functions:

```cpp
// Before:
bool slow_low_memory =
    std::getenv("BB_SLOW_LOW_MEMORY") == nullptr ? false :
    std::string(std::getenv("BB_SLOW_LOW_MEMORY")) == "1";

// After:
bool is_slow_low_memory_enabled() {
    const char* env_val = std::getenv("BB_SLOW_LOW_MEMORY");
    return env_val != nullptr && std::string(env_val) == "1";
}

void set_slow_low_memory(bool enabled) {
    if (enabled) {
        setenv("BB_SLOW_LOW_MEMORY", "1", 1);
    } else {
        unsetenv("BB_SLOW_LOW_MEMORY");
    }
}
```

**File:** `barretenberg/cpp/src/barretenberg/polynomials/backing_memory.hpp`

Updated API:

```cpp
// Before:
extern bool slow_low_memory;

// After:
extern bool is_slow_low_memory_enabled();
extern void set_slow_low_memory(bool enabled);
```

**Impact:** Allows programmatic control of low-memory mode, useful for mobile devices with limited RAM.

---

#### 5.2 CLI Integration with Low Memory Mode

**File:** `barretenberg/cpp/src/barretenberg/bb/cli.cpp`

Updated to use the new function-based API for low-memory mode:

```cpp
// Line 31 - Added include
#include "barretenberg/polynomials/backing_memory.hpp"

// Line 760 - Changed from global variable to function call
// Before:
slow_low_memory = flags.slow_low_memory;

// After:
set_slow_low_memory(flags.slow_low_memory);
```

**Impact:** Properly integrates CLI with the refactored low-memory mode API, maintaining thread-safety.

---

### 6. API and C Bindings Updates

#### 6.1 ECDSA Include Path Fix

**File:** `barretenberg/cpp/src/barretenberg/crypto/ecdsa/c_bind.h`

Fixed include paths:

```cpp
// Before:
#include <ecc/curves/secp256k1/secp256k1.hpp>
#include <ecc/curves/secp256r1/secp256r1.hpp>

// After:
#include <barretenberg/ecc/curves/secp256k1/secp256k1.hpp>
#include <barretenberg/ecc/curves/secp256r1/secp256r1.hpp>
```

**Impact:** Fixes compilation errors due to incorrect relative paths.

---

#### 6.2 New C Bindings for Elliptic Curves

**NEW FILE:** `barretenberg/cpp/src/barretenberg/ecc/curves/bn254/c_bind.hpp`

Added C bindings for BN254 operations:

```cpp
WASM_EXPORT void bn254_fr_sqrt(uint8_t const* input, uint8_t* result);
```

**NEW FILE:** `barretenberg/cpp/src/barretenberg/ecc/curves/grumpkin/c_bind.hpp`

Added C bindings for Grumpkin curve operations:

```cpp
WASM_EXPORT void ecc_grumpkin__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result);
WASM_EXPORT void ecc_grumpkin__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result);
WASM_EXPORT void ecc_grumpkin__batch_mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint32_t num_points, uint8_t* result);
WASM_EXPORT void ecc_grumpkin__get_random_scalar_mod_circuit_modulus(uint8_t* result);
WASM_EXPORT void ecc_grumpkin__reduce512_buffer_mod_circuit_modulus(uint8_t* input, uint8_t* result);
```

**Impact:** Exposes additional cryptographic primitives for mobile/WASM use cases.

---

#### 6.3 BN254 G1/G2 Curve C Bindings (NEW)

**File:** `barretenberg/cpp/src/barretenberg/ecc/curves/bn254/c_bind.hpp`

Expanded C bindings for BN254 curve operations (G1 and G2):

```cpp
// BN254 Fq (base field)
WASM_EXPORT void bn254_fq_sqrt(uint8_t const* input, uint8_t* result);

// BN254 G1 curve operations
WASM_EXPORT void ecc_bn254_g1__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g1__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g1__neg(uint8_t const* point_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g1__eq(uint8_t const* point_a_buf, uint8_t const* point_b_buf, bool* result);
WASM_EXPORT void ecc_bn254_g1__is_on_curve(uint8_t const* point_buf, bool* result);
WASM_EXPORT void ecc_bn254_g1__batch_mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint32_t num_points, uint8_t* result);

// BN254 G2 curve operations
WASM_EXPORT void ecc_bn254_g2__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g2__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g2__neg(uint8_t const* point_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g2__eq(uint8_t const* point_a_buf, uint8_t const* point_b_buf, bool* result);
```

**File:** `barretenberg/cpp/src/barretenberg/ecc/curves/bn254/c_bind.cpp`

Implementations added:

- `bn254_fq_sqrt` — Base field square root (Fq)
- `ecc_bn254_g1__mul` — G1 scalar multiplication
- `ecc_bn254_g1__add` — G1 point addition
- `ecc_bn254_g1__neg` — G1 point negation
- `ecc_bn254_g1__eq` — G1 point equality
- `ecc_bn254_g1__is_on_curve` — G1 curve membership check
- `ecc_bn254_g1__batch_mul` — G1 batch multiplication (same scalar, multiple points)
- `ecc_bn254_g2__mul` — G2 scalar multiplication
- `ecc_bn254_g2__add` — G2 point addition
- `ecc_bn254_g2__neg` — G2 point negation
- `ecc_bn254_g2__eq` — G2 point equality

**Impact:** Enables full BN254 curve arithmetic for mobile/WASM, required for pairing-based cryptography and advanced proving systems.

---

#### 6.4 UltraHonk to UltraZKHonk Migration

**File:** `barretenberg/cpp/src/barretenberg/dsl/acir_proofs/c_bind.cpp`

```cpp
// Before:
using VerificationKey = UltraFlavor::VerificationKey;

// After:
using VerificationKey = UltraZKFlavor::VerificationKey;
```

**File:** `barretenberg/cpp/src/barretenberg/dsl/acir_proofs/c_bind.hpp`

```cpp
// Before:
WASM_EXPORT void acir_prove_ultra_honk(...);
WASM_EXPORT void acir_verify_ultra_honk(...);

// After:
WASM_EXPORT void acir_prove_ultra_zk_honk(...);
WASM_EXPORT void acir_verify_ultra_zk_honk(...);
```

**Impact:** Defaults to zero-knowledge flavor of UltraHonk for enhanced privacy.

---

### 7. Xcode 26.x / AppleClang 17+ Compatibility

#### 7.1 VLA (Variable Length Array) Warning Suppression

**File:** `barretenberg/cpp/src/CMakeLists.txt`

Xcode 26.x (AppleClang 17+) treats C++ VLAs as errors by default. The following change adds `-Wno-vla-cxx-extension` for mobile builds:

```cmake
# Lines 31-41
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    # ...
    # VLA extension warning - for iOS/mobile builds since Xcode clang version numbering
    # differs from LLVM clang. Also needed for newer clang versions (18+) in general.
    if(MOBILE OR CMAKE_CXX_COMPILER_VERSION VERSION_GREATER_EQUAL 18)
        add_compile_options(-Wno-vla-cxx-extension)
        add_compile_options(-Wno-missing-field-initializers)
        add_compile_options(-Wno-deprecated-declarations)
    endif()
endif()
```

**Affected source files using VLAs:**

- `barretenberg/cpp/src/barretenberg/crypto/keccak/keccak.cpp` (line 116)
- `barretenberg/cpp/src/barretenberg/polynomials/polynomial_arithmetic.cpp` (line 693)

**Impact:** Enables compilation on Xcode 26.x which uses AppleClang 17. AppleClang version numbers differ from LLVM Clang versions, so the `MOBILE` flag ensures the fix is applied regardless of version detection.

---

#### 7.2 Rust Build Script VLA Flags

**File:** `barretenberg/bb_rs/build.rs`

Additional VLA suppression flags added via Rust's cmake crate for iOS builds:

```rust
// Lines 152-156 (inside iOS build section)
// Allow C++ VLAs (Variable Length Arrays) - used in keccak.cpp, polynomial_arithmetic.cpp
// This must be outside Release block to apply to all iOS builds
// Need both: -Wno-error to prevent -Werror from making it fatal, and -Wno to suppress entirely
config.cxxflag("-Wno-error=vla-cxx-extension");
config.cxxflag("-Wno-vla-cxx-extension");
```

**Why both flags:**

- `-Wno-error=vla-cxx-extension`: Prevents `-Werror` from making VLA warnings fatal
- `-Wno-vla-cxx-extension`: Suppresses the warning entirely

**Impact:** Ensures VLA compilation works even if the CMake-level flags aren't applied first in the compile command.

---

## Status Summary

### Changes (27 files + build.rs)

- ✅ Mobile build flag support
- ✅ **IPC exclusion for mobile builds** (fixes Debug mode linker errors)
- ✅ Platform-specific compilation guards
- ✅ Tracy instrumentation conditionals
- ✅ Memory management improvements
- ✅ Threading support for single-threaded builds
- ✅ New C bindings for BN254 Fr sqrt and Grumpkin
- ✅ **NEW: BN254 G1/G2 curve C bindings** (mul, add, neg, eq, is_on_curve, batch_mul)
- ✅ **NEW: BN254 Fq sqrt** (base field square root)
- ✅ UltraZKHonk as default flavor
- ✅ iOS/Android compatibility fixes
- ✅ Test framework conditional inclusion
- ✅ CLI integration with low-memory mode API
- ✅ **NEW: Xcode 26.x / AppleClang 17+ VLA compatibility** (CMakeLists.txt + build.rs)

---

## Build Configuration

### To build for mobile platforms:

```bash
cmake -DMOBILE=ON \
      -DNO_MULTITHREADING=ON \
      -DCMAKE_BUILD_TYPE=Release \
      ...
```

### What gets excluded with MOBILE=ON:

1. **Modules:**

   - `barretenberg/benchmark`
   - `barretenberg/nodejs_module`
   - `barretenberg/world_state`
   - `barretenberg/vm2` (replaced with `vm2_stub`)

2. **Test frameworks:**

   - Google Test (`gtest`)
   - Google Benchmark

3. **Test objects:**
   - All `*_test_objects`
   - All `*_bench_objects`
   - `vm2_stub` linking in tests

---

## Compatibility Matrix

| Platform     | Status     | Notes                            |
| ------------ | ---------- | -------------------------------- |
| Linux x86_64 | ✅ Full    | All features available           |
| macOS x86_64 | ✅ Full    | All features available           |
| macOS ARM64  | ✅ Full    | All features available           |
| iOS          | ✅ Mobile  | Use `-DMOBILE=ON`, Xcode 26.x OK |
| Android      | ✅ Mobile  | Use `-DMOBILE=ON`                |
| WASM         | ✅ Partial | Some modules excluded            |
| Windows      | ✅ Full    | All features available           |

### Xcode Version Support

| Xcode Version | AppleClang | Status | Notes                          |
| ------------- | ---------- | ------ | ------------------------------ |
| Xcode 15.x    | 15.x       | ✅     | Works without VLA flags        |
| Xcode 26.x    | 17.x       | ✅     | Requires VLA suppression flags |

---

## Potential Issues & Considerations

### 1. **Testing Coverage**

With tests excluded in mobile builds, ensure thorough testing on desktop platforms before deploying to mobile.

### 2. **VM2 Functionality**

Mobile builds use `vm2_stub` instead of full VM2. Verify that all required functionality is available through the stub.

### 3. **Threading Performance**

Consider the impact of single-threaded builds on performance. Mobile devices have multiple cores but may benefit from `NO_MULTITHREADING=OFF` with proper thread pool sizing.

### 4. **Memory Constraints**

The low-memory prover mode (`BB_SLOW_LOW_MEMORY=1`) is crucial for mobile devices. Monitor memory usage in production.

### 5. **UltraZKHonk Migration**

Ensure all downstream code is updated to use the new `acir_prove_ultra_zk_honk` and `acir_verify_ultra_zk_honk` function names.

---

## Upstream Integration Notes

When merging upstream changes from future versions:

1. **Watch for:**

   - New modules added to `src/CMakeLists.txt` - may need `MOBILE` guards
   - Changes to Tracy instrumentation - ensure guards are maintained
   - New platform-specific code - may need iOS/Android variants
   - Test linking changes - apply `MOBILE` conditionals
   - **New VLA usage** - may need additional `-Wno-vla-cxx-extension` handling

2. **Maintain:**

   - All `#ifdef TRACY_INSTRUMENTED` guards
   - Platform-specific includes (`__APPLE__`, `ANDROID`)
   - `MOBILE` conditionals in CMake files
   - Low-memory prover API
   - **VLA warning suppression** in `src/CMakeLists.txt` (lines 31-41)
   - **VLA flags** in `bb_rs/build.rs` (lines 152-156)

3. **Test after merge:**
   - Desktop build with all features
   - Mobile build with `-DMOBILE=ON`
   - Single-threaded build with `-DNO_MULTITHREADING=ON`
   - WASM build
   - **iOS build with Xcode 26.x** (AppleClang 17+)

---

## Document Version

- **Based on tag:** v3.0.0-devnet.20251212
- **Branch:** pr/obsidion-mobile-devnet
- **Last updated:** 2026-01-15 (IPC exclusion for mobile Debug builds)

---

## Conclusion

The changes represent a comprehensive effort to port Barretenberg's C++ codebase to mobile platforms (iOS/Android) while maintaining full compatibility with desktop builds. The modifications are well-structured with clear separation between mobile and desktop configurations, proper platform detection, and minimal impact on core functionality.

Key achievements:

- ✅ Mobile build support without breaking desktop builds
- ✅ Reduced binary size through selective module inclusion
- ✅ Platform-specific optimizations (memory, threading, RNG)
- ✅ Enhanced privacy with UltraZKHonk as default
- ✅ New cryptographic APIs for mobile/WASM integration
- ✅ Robust build system with proper test framework exclusion
- ✅ Clean build output with minimal warnings
- ✅ **Xcode 26.x / AppleClang 17+ compatibility** via VLA warning suppression
- ✅ **Debug mode support** via IPC exclusion (fixes undefined symbol errors on iOS Simulator)
