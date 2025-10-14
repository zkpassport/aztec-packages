// === AUDIT STATUS ===
// internal:    { status: not started, auditors: [], date: YYYY-MM-DD }
// external_1:  { status: not started, auditors: [], date: YYYY-MM-DD }
// external_2:  { status: not started, auditors: [], date: YYYY-MM-DD }
// =====================

#include "../bn254/fr.hpp"

// Silencing warnings about reserved identifiers. Fixing would break downstream code that calls our WASM API.
// NOLINTBEGIN(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)
WASM_EXPORT void bn254_fr_sqrt(uint8_t const* input, uint8_t* result);
// NOLINTEND(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)


