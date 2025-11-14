use cmake::Config;
use std::env;
use std::path::PathBuf;
use std::process::Command;

/// Fix duplicate type definitions in the generated bindings file
/// It's known bug with bindgen that generates duplicate type definitions
/// if they are defined in multiple templates.
/// It's easier to just post-process the bindings file to remove the duplicate type definitions,
/// rather than trying to patch for it in the C++ code.
/// Fix unsafe extern blocks for Rust 1.71.1 compatibility
/// Rust 1.71.1 doesn't support "unsafe extern" blocks, so we need to convert them
/// to regular "extern" blocks. Functions inside extern "C" blocks are implicitly unsafe.
fn fix_unsafe_extern_blocks(bindings_file: &PathBuf) {
    println!("cargo:warning=Fixing unsafe extern blocks for Rust 1.71.1 compatibility...");
    
    let content = std::fs::read_to_string(bindings_file)
        .expect("Failed to read bindings file");
    
    // Simply replace "unsafe extern \"C\" {" with "extern \"C\" {"
    // Functions inside extern "C" blocks are implicitly unsafe to call in Rust,
    // so we don't need to add "unsafe" to individual function declarations
    let fixed_content = content.replace("unsafe extern \"C\" {", "extern \"C\" {");
    
    std::fs::write(bindings_file, fixed_content)
        .expect("Failed to write fixed bindings file");
    
    println!("cargo:warning=Successfully fixed unsafe extern blocks");
}

fn fix_duplicate_bindings(bindings_file: &PathBuf) {
    println!("cargo:warning=Fixing duplicate type definitions in bindings...");
    
    let scripts_dir = PathBuf::from("scripts");
    let python_script = scripts_dir.join("fix_bindings.py");
    let shell_script = scripts_dir.join("fix_bindings.sh");
    
    // Try Python script first
    if python_script.exists() {
        let output = Command::new("python3")
            .arg(&python_script)
            .arg(bindings_file)
            .output();
            
        match output {
            Ok(result) => {
                if result.status.success() {
                    println!("cargo:warning=Successfully fixed bindings with Python script");
                    return;
                } else {
                    println!("cargo:warning=Python script failed, trying shell script...");
                }
            }
            Err(_) => {
                println!("cargo:warning=Python not available, trying shell script...");
            }
        }
    }
    
    // Fallback to shell script
    if shell_script.exists() {
        let output = Command::new("bash")
            .arg(&shell_script)
            .arg(bindings_file)
            .output();
            
        match output {
            Ok(result) => {
                if result.status.success() {
                    println!("cargo:warning=Successfully fixed bindings with shell script");
                } else {
                    println!("cargo:warning=Shell script failed");
                    eprintln!("Shell script stderr: {}", String::from_utf8_lossy(&result.stderr));
                }
            }
            Err(e) => {
                println!("cargo:warning=Failed to run shell script: {}", e);
            }
        }
    } else {
        println!("cargo:warning=No fix scripts found, skipping duplicate removal");
    }
}

fn main() {
    // Notify Cargo to rerun this build script if `build.rs` changes.
    println!("cargo:rerun-if-changed=build.rs");

    // cfg!(target_os = "<os>") does not work so we get the value
    // of the target_os environment variable to determine the target OS.
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();
    
    // Get absolute path to barretenberg C++ source (relative to bb_rs/)
    let cpp_src_path = PathBuf::from("../cpp/src").canonicalize().unwrap();

    // Read parallel jobs from environment (for iOS builds only)
    // Default to 1 if not set to maintain safe defaults
    let build_jobs = env::var("CARGO_BUILD_JOBS").unwrap_or_else(|_| "1".to_string());
    
    // Determine build type from Cargo profile (debug or release)
    // PROFILE env var is set by Cargo: "debug" or "release"
    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
    let cmake_build_type = match profile.as_str() {
        "release" => "Release",
        _ => "Debug",
    };
    
    // Check if Aztec VM should be disabled (default: OFF, can be enabled via env var)
    // Set DISABLE_AZTEC_VM=1 in your build script to skip VM2 compilation
    let disable_aztec_vm = env::var("DISABLE_AZTEC_VM")
        .map(|v| v == "1" || v.to_lowercase() == "true" || v.to_lowercase() == "on")
        .unwrap_or(false);
    
    // Debug output to see what's happening
    println!("cargo:warning=🔍 DISABLE_AZTEC_VM env var: {:?}", env::var("DISABLE_AZTEC_VM"));
    println!("cargo:warning=🔍 disable_aztec_vm parsed: {}", disable_aztec_vm);
    
    // Check if testing should be disabled (default: ON, set BB_DISABLE_TESTING=1 to disable)
    let disable_testing = env::var("BB_DISABLE_TESTING")
        .map(|v| v == "1" || v.to_lowercase() == "true" || v.to_lowercase() == "on")
        .unwrap_or(false);
    
    // Check if multithreading should be disabled (default: ON, set BB_DISABLE_MULTITHREADING=1 to disable)
    let disable_multithreading = env::var("BB_DISABLE_MULTITHREADING")
        .map(|v| v == "1" || v.to_lowercase() == "true" || v.to_lowercase() == "on")
        .unwrap_or(false);
    
    // Check which build target to use (default: "bb", set BB_BUILD_TARGET=barretenberg for library only)
    let build_target = env::var("BB_BUILD_TARGET").unwrap_or_else(|_| "bb".to_string());
    
    if disable_aztec_vm {
        println!("cargo:warning=⚠️  Aztec VM (VM2) compilation is DISABLED");
    }
    if disable_testing {
        println!("cargo:warning=⚠️  Testing suite compilation is DISABLED");
    }
    if disable_multithreading {
        println!("cargo:warning=⚠️  Multithreading is DISABLED");
    }
    if build_target != "bb" {
        println!("cargo:warning=📦 Building target: {}", build_target);
    }
    
    // Build the C++ code using CMake and get the build directory path.
    let dst;
    // iOS - Enable parallelism (iOS doesn't have the macOS linker issues)
    if target_os == "ios" {
        println!("cargo:warning=🚀 Building for iOS with {} parallel jobs ({})", build_jobs, cmake_build_type);
        let mut config = Config::new("../cpp");
        config
            .generator("Ninja")
            .configure_arg(format!("-DCMAKE_BUILD_TYPE={}", cmake_build_type))
            .configure_arg("-DPLATFORM=OS64")
            .configure_arg("-DDEPLOYMENT_TARGET=15.1")
            .configure_arg("--toolchain=../bb_rs/ios.toolchain.cmake")
            // .configure_arg("-DTRACY_ENABLE=OFF")
            .configure_arg("-DFUZZING=OFF")
            // Skip AVM/vm2 on mobile (not needed for wallet crypto)
            .configure_arg("-DAVM=OFF")
            .configure_arg("-DMOBILE=ON");
            // // iOS doesn't need Node.js bindings, skip nodejs_module to avoid yarn/npm dependencies
            // .configure_arg("-DBUILD_NODEJS_MODULE=OFF");
        
        // Performance optimizations (Release mode only)
        if cmake_build_type == "Release" {
            // Enable Link-Time Optimization
            config.configure_arg("-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=ON");
            
            // ARM NEON vectorization - use .cxxflag() to APPEND, not replace
            config.cxxflag("-ftree-vectorize");      // Enable loop vectorization
            config.cxxflag("-fvectorize");           // Enable LLVM vectorization
            config.cxxflag("-march=armv8-a");      //  Generic ARM64, works on all 64-bit iOS
            // Prevent deprecated warnings from becoming errors in benchmarks
            config.cxxflag("-Wno-error=deprecated-declarations");
            config.cxxflag("-Wno-deprecated-declarations");
            
            println!("cargo:warning=🚀 Performance optimizations enabled: LTO + ARM NEON + A14 tuning");
        }
        
        // Apply optional optimizations
        if disable_aztec_vm {
            println!("cargo:warning=🔧 Adding -DDISABLE_AZTEC_VM=ON to CMake config");
            config.configure_arg("-DDISABLE_AZTEC_VM=ON");
        } else {
            println!("cargo:warning=⚠️  NOT adding DISABLE_AZTEC_VM - VM2 will be compiled!");
        }
        if disable_testing {
            println!("cargo:warning=🔧 DISABLING tests (controlled by MOBILE=ON flag)");
            // Note: Tests/benches are actually controlled by NOT MOBILE in module.cmake
            // The -DTESTING/-DBUILD_TESTING flags don't exist in Barretenberg's CMake
        }
        if disable_multithreading {
            config.configure_arg("-DMULTITHREADING=OFF");
        }
        
        // For iOS, we need to build libdeflate_static and the main target
        // Build all targets to ensure dependencies are built
        dst = config
            .build_arg(format!("-j{}", build_jobs))
            .build_arg("libdeflate_static")
            .build_arg(&build_target)
            .build();
    }
    // Android
    else if target_os == "android" {
        let android_home = option_env!("ANDROID_HOME").expect("ANDROID_HOME not set");
        let ndk_version = option_env!("NDK_VERSION").expect("NDK_VERSION not set");

        let mut config = Config::new("../cpp");
        config
            .generator("Ninja")
            .configure_arg("-DCMAKE_BUILD_TYPE=Release")
            .configure_arg("-DANDROID_ABI=arm64-v8a")
            .configure_arg("-DANDROID_PLATFORM=android-33")
            .configure_arg(&format!("--toolchain={}/ndk/{}/build/cmake/android.toolchain.cmake", android_home, ndk_version))
            .configure_arg("-DTRACY_ENABLE=OFF")
            // Skip AVM/vm2 on mobile (not needed for wallet crypto)
            .configure_arg("-DAVM=OFF")
            // Skip ipc, lmdblib, nodejs_module, world_state, vm2 for mobile
            .configure_arg("-DMOBILE=ON")
            // Android doesn't need Node.js bindings either
            .configure_arg("-DBUILD_NODEJS_MODULE=OFF");
        // Prevent deprecated warnings from becoming errors in benchmarks
        config.cxxflag("-Wno-error=deprecated-declarations");
        config.cxxflag("-Wno-deprecated-declarations");
        
        // Apply optional optimizations
        if disable_aztec_vm {
            config.configure_arg("-DDISABLE_AZTEC_VM=ON");
        }
        if disable_testing {
            println!("cargo:warning=🔧 DISABLING tests (controlled by MOBILE=ON flag)");
            // Note: Tests/benches are actually controlled by NOT MOBILE in module.cmake
            // The -DTESTING/-DBUILD_TESTING flags don't exist in Barretenberg's CMake
        }
        if disable_multithreading {
            config.configure_arg("-DMULTITHREADING=OFF");
        }
        
        dst = config
            .build_target(&build_target)
            .build();
    }
    // MacOS and other platforms
    else {
        println!("cargo:warning=🔨 Building for {} ({})", target_os, cmake_build_type);
        let mut config = Config::new("../cpp");
        config
            .generator("Ninja")
            .configure_arg(format!("-DCMAKE_BUILD_TYPE={}", cmake_build_type))
            // .configure_arg("-DTRACY_ENABLE=OFF")
            // Skip AVM/vm2 (not needed for this library build)
            .configure_arg("-DAVM=OFF")
            // Skip ipc, lmdblib, nodejs_module, world_state, vm2 for mobile/embedded builds
            .configure_arg("-DMOBILE=ON");
        // Prevent deprecated warnings from becoming errors in benchmarks
        config.cxxflag("-Wno-error=deprecated-declarations");
        config.cxxflag("-Wno-deprecated-declarations");
        
        // Apply optional optimizations
        if disable_aztec_vm {
            config.configure_arg("-DDISABLE_AZTEC_VM=ON");
        }
        if disable_testing {
            println!("cargo:warning=🔧 DISABLING tests (controlled by MOBILE=ON flag)");
            // Note: Tests/benches are actually controlled by NOT MOBILE in module.cmake
            // The -DTESTING/-DBUILD_TESTING flags don't exist in Barretenberg's CMake
        }
        if disable_multithreading {
            config.configure_arg("-DMULTITHREADING=OFF");
        }
        
        dst = config
            .build_target(&build_target)
            .build();
    }

    // Add the library search path for Rust to find during linking.
    println!("cargo:rustc-link-search={}/build/lib", dst.display());

    // Add the library search path for libdeflate
    println!("cargo:rustc-link-search={}/build/_deps/libdeflate-build", dst.display());

    // Add the library search path for LMDB
    println!("cargo:rustc-link-search={}/build/_deps/lmdb/src/lmdb_repo/libraries/liblmdb", dst.display());

    // Link the `barretenberg` static library.
    println!("cargo:rustc-link-lib=static=barretenberg");

    // Link the `env` static library
    println!("cargo:rustc-link-lib=static=env");

    // Link the `libdeflate` static library.
    println!("cargo:rustc-link-lib=static=deflate");

    // Link the `lmdb` static library.
    println!("cargo:rustc-link-lib=static=lmdb");

    // Link the C++ standard library.
    if cfg!(target_os = "macos") || cfg!(target_os = "ios") {
        println!("cargo:rustc-link-lib=c++");
    } else {
        println!("cargo:rustc-link-lib=stdc++");
    }

    // Copy the headers to the build directory.
    // Fix an issue where the headers are not included in the build.
    Command::new("sh").args(&["copy-headers.sh", &format!("{}/build/include", dst.display())]).output().unwrap();

    let mut builder = bindgen::Builder::default();

    if target_os == "android" {
        let android_home = option_env!("ANDROID_HOME").expect("ANDROID_HOME not set");
        let ndk_version = option_env!("NDK_VERSION").expect("NDK_VERSION not set");
        let host_tag = option_env!("HOST_TAG").expect("HOST_TAG not set");

        builder = builder
        // Add the include path for headers.
        .clang_args([
            "-std=c++20",
            "-xc++",
            &format!("-I{}/build/include", dst.display()),
            // Dependencies' include paths needs to be added manually.
            &format!("-I{}/build/_deps/msgpack-c/src/msgpack-c/include", dst.display()),
            //&format!("-I{}/build/_deps/libdeflate-src", dst.display()),
            &format!("-I{}/ndk/{}/toolchains/llvm/prebuilt/{}/sysroot/usr/include/c++/v1", android_home, ndk_version, host_tag),
            &format!("-I{}/ndk/{}/toolchains/llvm/prebuilt/{}/sysroot/usr/include", android_home, ndk_version, host_tag),
            &format!("-I{}/ndk/{}/toolchains/llvm/prebuilt/{}/sysroot/usr/include/aarch64-linux-android", android_home, ndk_version, host_tag)
        ]);
    } else if target_os == "ios" {
        // Detect iOS Simulator vs Device target
        let target = env::var("TARGET").unwrap_or_default();
        let (platform, sdk) = if target.contains("sim") {
            ("iPhoneSimulator", "iPhoneSimulator.sdk")
        } else {
            ("iPhoneOS", "iPhoneOS.sdk")
        };
        
        // Read iOS deployment target from environment (set by build-dev-cache.sh)
        let ios_version = env::var("IPHONEOS_DEPLOYMENT_TARGET").unwrap_or_else(|_| "15.1".to_string());
        println!("cargo:warning=📱 iOS deployment target: {}", ios_version);
        
        builder = builder
        // Add the include path for headers.
        .clang_args([
            "-std=c++20",
            "-xc++",
            &format!("-I{}/build/include", dst.display()),
            // Add barretenberg source directory for actual header files (absolute path)
            &format!("-I{}", cpp_src_path.display()),
            // Dependencies' include paths needs to be added manually.
            &format!("-I{}/build/_deps/msgpack-c/src/msgpack-c/include", dst.display()),
            &format!("-I{}/build/include/barretenberg", dst.display()),
            //&format!("-I{}/build/_deps/libdeflate-src", dst.display()),
            &format!("-I/Applications/Xcode.app/Contents/Developer/Platforms/{}.platform/Developer/SDKs/{}/usr/include/c++/v1", platform, sdk),
            &format!("-I/Applications/Xcode.app/Contents/Developer/Platforms/{}.platform/Developer/SDKs/{}/usr/include", platform, sdk),
            // Fix for iOS system type issues
            "-D_LIBCPP_DISABLE_AVAILABILITY",
            &format!("--sysroot=/Applications/Xcode.app/Contents/Developer/Platforms/{}.platform/Developer/SDKs/{}", platform, sdk),
            // Set iOS deployment target for bindgen
            &format!("-miphoneos-version-min={}", ios_version),
            // "-I/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/usr/include/c++/v1",
            // "-I/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/usr/include",
            // "-target", "arm64-apple-ios15.0",
            // "--sysroot=/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk"
        ]);
    } else if target_os == "macos" {
        builder = builder
            // Add the include path for headers.
            .clang_args([
                "-std=c++20",
                "-xc++",
                &format!("-I{}/build/include", dst.display()),
                // Dependencies' include paths needs to be added manually.
                &format!("-I{}/build/_deps/msgpack-c/src/msgpack-c/include", dst.display()),
                // Add barretenberg include path for relative includes
                &format!("-I{}/build/include/barretenberg", dst.display()),
                //&format!("-I{}/build/_deps/libdeflate-src", dst.display()),
                "-I/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include/c++/v1",
                "-I/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include",
                // Fix for macOS system type issues
                "-D_LIBCPP_DISABLE_AVAILABILITY",
                "-target", "arm64-apple-macosx15.1",
                "--sysroot=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk",
            ]);
    } else {
        builder = builder
        // Add the include path for headers.
        .clang_args([
            "-std=c++20",
            "-xc++",
            &format!("-I{}/build/include", dst.display()),
            // Dependencies' include paths needs to be added manually.
            &format!("-I{}/build/_deps/msgpack-c/src/msgpack-c/include", dst.display()),
            //&format!("-I{}/build/_deps/libdeflate-src", dst.display()),
        ]);
    }

    let bindings = builder
        // Generate bindings compatible with Rust 1.71.1 (no unsafe extern blocks)
        .rustfmt_bindings(false)
        .layout_tests(false)
        .derive_debug(false)
        .derive_default(false)
        .derive_copy(false)
        .derive_eq(false)
        .derive_partialeq(false)
        .derive_partialord(false)
        .derive_ord(false)
        .derive_hash(false)
        // Use older bindgen syntax for Rust 1.71.1 compatibility
        .use_core()
        .ctypes_prefix("::std::os::raw")
        // The input header we would like to generate bindings for.

        .header_contents(
            "wrapper.hpp",
            r#"
                #include <barretenberg/crypto/pedersen_commitment/c_bind.hpp>
                #include <barretenberg/crypto/pedersen_hash/c_bind.hpp>
                #include <barretenberg/crypto/poseidon2/c_bind.hpp>
                #include <barretenberg/crypto/blake2s/c_bind.hpp>
                #include <barretenberg/crypto/aes128/c_bind.hpp>
                #include <barretenberg/crypto/schnorr/c_bind.hpp>
                #include <barretenberg/crypto/ecdsa/c_bind.h>
                #include <barretenberg/ecc/curves/grumpkin/c_bind.hpp>
                #include <barretenberg/ecc/curves/secp256k1/c_bind.hpp>
                #include <barretenberg/ecc/curves/bn254/c_bind.hpp>
                #include <barretenberg/srs/c_bind.hpp>
                #include <barretenberg/common/c_bind.hpp>
                #include <barretenberg/dsl/acir_proofs/c_bind.hpp>
                #include <barretenberg/bbapi/c_bind.hpp>
                

            "#,
        )
        .allowlist_function("pedersen_commit")
        .allowlist_function("pedersen_hash")
        .allowlist_function("pedersen_hashes")
        .allowlist_function("pedersen_hash_buffer")
        .allowlist_function("poseidon2_hash")
        .allowlist_function("poseidon2_hashes")
        .allowlist_function("poseidon2_permutation")
        .allowlist_function("blake2s")
        .allowlist_function("blake2s_to_field_")
        .allowlist_function("schnorr_compute_public_key")
        .allowlist_function("schnorr_construct_signature")
        .allowlist_function("schnorr_verify_signature")
        .allowlist_function("schnorr_multisig_create_multisig_public_key")
        .allowlist_function("schnorr_multisig_validate_and_combine_signer_pubkeys")
        .allowlist_function("schnorr_multisig_construct_signature_round_1")
        .allowlist_function("schnorr_multisig_construct_signature_round_2")
        .allowlist_function("schnorr_multisig_combine_signatures")
        // ECDSA secp256k1 functions
        .allowlist_function("ecdsa__compute_public_key")
        .allowlist_function("ecdsa__construct_signature_")
        .allowlist_function("ecdsa__recover_public_key_from_signature_")
        .allowlist_function("ecdsa__verify_signature_")
        // ECDSA secp256r1 functions
        .allowlist_function("ecdsa_r_compute_public_key")
        .allowlist_function("ecdsa_r_construct_signature_")
        .allowlist_function("ecdsa_r_recover_public_key_from_signature_")
        .allowlist_function("ecdsa_r_verify_signature_")
        .allowlist_function("aes_encrypt_buffer_cbc")
        .allowlist_function("aes_decrypt_buffer_cbc")
        // Grumpkin curve functions
        .allowlist_function("ecc_grumpkin__mul")
        .allowlist_function("ecc_grumpkin__add")
        .allowlist_function("ecc_grumpkin__batch_mul")
        .allowlist_function("ecc_grumpkin__get_random_scalar_mod_circuit_modulus")
        .allowlist_function("ecc_grumpkin__reduce512_buffer_mod_circuit_modulus")
        // Secp256k1 curve functions
        .allowlist_function("ecc_secp256k1__mul")
        .allowlist_function("ecc_secp256k1__get_random_scalar_mod_circuit_modulus")
        .allowlist_function("ecc_secp256k1__reduce512_buffer_mod_circuit_modulus")
        // BN254 field functions
        .allowlist_function("bn254_fr_sqrt")
        .allowlist_function("srs_init_srs")
        .allowlist_function("srs_init_grumpkin_srs")
        .allowlist_function("test_threads")
        .allowlist_function("common_init_slab_allocator")
        .allowlist_function("acir_get_circuit_sizes")
        .allowlist_function("acir_serialize_proof_into_fields")
        .allowlist_function("acir_serialize_verification_key_into_fields")
        .allowlist_function("acir_prove_ultra_zk_honk")
        .allowlist_function("acir_prove_ultra_keccak_honk")
        .allowlist_function("acir_prove_ultra_keccak_zk_honk")
        .allowlist_function("acir_prove_aztec_client")
        // TODO: enable the Starknet flavors once we enable the appropriate flag
        // for the build process.
        //.allowlist_function("acir_prove_ultra_starknet_honk")
        //.allowlist_function("acir_prove_ultra_starknet_zk_honk")
        .allowlist_function("acir_verify_ultra_zk_honk")
        .allowlist_function("acir_verify_ultra_keccak_honk")
        .allowlist_function("acir_verify_ultra_keccak_zk_honk")
        .allowlist_function("acir_verify_aztec_client")
        .allowlist_function("acir_gates_aztec_client")
        //.allowlist_function("acir_verify_ultra_starknet_honk")
        //.allowlist_function("acir_verify_ultra_starknet_zk_honk")
        .allowlist_function("acir_write_vk_ultra_honk")
        .allowlist_function("acir_write_vk_ultra_keccak_honk")
        .allowlist_function("acir_write_vk_ultra_keccak_zk_honk")
        //.allowlist_function("acir_write_vk_ultra_starknet_honk")
        //.allowlist_function("acir_write_vk_ultra_starknet_zk_honk")
        .allowlist_function("acir_prove_and_verify_ultra_honk")
        .allowlist_function("acir_proof_as_fields_ultra_honk")
        .allowlist_function("acir_vk_as_fields_ultra_honk")
        .allowlist_function("acir_vk_as_fields_mega_honk")
        // Tell cargo to invalidate the built crate whenever any of the included header files changed.
        .allowlist_function("bbapi")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        // Finish the builder and generate the bindings.
        .generate()
        // Unwrap the Result and panic on failure.
        .expect("Unable to generate bindings");

    // Write the bindings to the $OUT_DIR/bindings.rs file.
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    let bindings_file = out_path.join("bindings.rs");
    bindings
        .write_to_file(&bindings_file)
        .expect("Couldn't write bindings!");

    // Fix duplicate type definitions in the generated bindings
    fix_duplicate_bindings(&bindings_file);
    
    // Fix unsafe extern blocks for Rust 1.71.1 compatibility
    fix_unsafe_extern_blocks(&bindings_file);
}
