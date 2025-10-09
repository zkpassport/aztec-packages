// === AUDIT STATUS ===
// internal:    { status: not started, auditors: [], date: YYYY-MM-DD }
// external_1:  { status: not started, auditors: [], date: YYYY-MM-DD }
// external_2:  { status: not started, auditors: [], date: YYYY-MM-DD }
// =====================

#include "grumpkin.hpp"

// Silencing warnings about reserved identifiers. Fixing would break downstream code that calls our WASM API.
// NOLINTBEGIN(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)
WASM_EXPORT void ecc_grumpkin__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result);

WASM_EXPORT void ecc_grumpkin__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result);

WASM_EXPORT void ecc_grumpkin__batch_mul(uint8_t const* point_buf,
                                         uint8_t const* scalar_buf,
                                         uint32_t num_points,
                                         uint8_t* result);

WASM_EXPORT void ecc_grumpkin__get_random_scalar_mod_circuit_modulus(uint8_t* result);

WASM_EXPORT void ecc_grumpkin__reduce512_buffer_mod_circuit_modulus(uint8_t* input, uint8_t* result);
// NOLINTEND(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)

