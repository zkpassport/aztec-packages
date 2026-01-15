// === AUDIT STATUS ===
// internal:    { status: not started, auditors: [], date: YYYY-MM-DD }
// external_1:  { status: not started, auditors: [], date: YYYY-MM-DD }
// external_2:  { status: not started, auditors: [], date: YYYY-MM-DD }
// =====================

#pragma once

#include "../bn254/fq.hpp"
#include "../bn254/fr.hpp"
#include "../bn254/g1.hpp"
#include "../bn254/g2.hpp"
#include "barretenberg/common/wasm_export.hpp"

// Silencing warnings about reserved identifiers. Fixing would break downstream code that calls our WASM API.
// NOLINTBEGIN(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)

// ========== BN254 Fr (scalar field) ==========
WASM_EXPORT void bn254_fr_sqrt(uint8_t const* input, uint8_t* result);

// ========== BN254 Fq (base field) ==========
WASM_EXPORT void bn254_fq_sqrt(uint8_t const* input, uint8_t* result);

// ========== BN254 G1 curve operations ==========
WASM_EXPORT void ecc_bn254_g1__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g1__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g1__neg(uint8_t const* point_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g1__eq(uint8_t const* point_a_buf, uint8_t const* point_b_buf, bool* result);
WASM_EXPORT void ecc_bn254_g1__is_on_curve(uint8_t const* point_buf, bool* result);
WASM_EXPORT void ecc_bn254_g1__batch_mul(uint8_t const* point_buf,
                                         uint8_t const* scalar_buf,
                                         uint32_t num_points,
                                         uint8_t* result);

// ========== BN254 G2 curve operations ==========
WASM_EXPORT void ecc_bn254_g2__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g2__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g2__neg(uint8_t const* point_buf, uint8_t* result);
WASM_EXPORT void ecc_bn254_g2__eq(uint8_t const* point_a_buf, uint8_t const* point_b_buf, bool* result);

// NOLINTEND(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)
