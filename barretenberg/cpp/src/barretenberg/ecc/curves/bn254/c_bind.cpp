// === AUDIT STATUS ===
// internal:    { status: not started, auditors: [], date: YYYY-MM-DD }
// external_1:  { status: not started, auditors: [], date: YYYY-MM-DD }
// external_2:  { status: not started, auditors: [], date: YYYY-MM-DD }
// =====================

#include "c_bind.hpp"
#include "../bn254/fr.hpp"
#include "../bn254/fq.hpp"
#include "../bn254/g1.hpp"
#include "../bn254/g2.hpp"
#include "barretenberg/common/wasm_export.hpp"

using namespace bb;

// ========== BN254 Fr (scalar field) ==========

WASM_EXPORT void bn254_fr_sqrt(uint8_t const* input, uint8_t* result)
{
    using serialize::write;
    auto input_fr = from_buffer<bb::fr>(input);
    auto [is_sqr, root] = input_fr.sqrt();

    uint8_t* is_sqrt_result_ptr = result;
    uint8_t* root_result_ptr = result + 1;

    write(is_sqrt_result_ptr, is_sqr);
    write(root_result_ptr, root);
}

// ========== BN254 Fq (base field) ==========

WASM_EXPORT void bn254_fq_sqrt(uint8_t const* input, uint8_t* result)
{
    using serialize::write;
    auto input_fq = from_buffer<bb::fq>(input);
    auto [is_sqr, root] = input_fq.sqrt();

    uint8_t* is_sqrt_result_ptr = result;
    uint8_t* root_result_ptr = result + 1;

    write(is_sqrt_result_ptr, is_sqr);
    write(root_result_ptr, root);
}

// ========== BN254 G1 curve operations ==========

WASM_EXPORT void ecc_bn254_g1__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result)
{
    using serialize::write;
    auto point = from_buffer<bb::g1::affine_element>(point_buf);
    auto scalar = from_buffer<bb::fr>(scalar_buf);
    bb::g1::affine_element r = point * scalar;
    write(result, r);
}

WASM_EXPORT void ecc_bn254_g1__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result)
{
    using serialize::write;
    auto point_a = from_buffer<bb::g1::affine_element>(point_a_buf);
    auto point_b = from_buffer<bb::g1::affine_element>(point_b_buf);
    bb::g1::affine_element r = point_a + point_b;
    write(result, r);
}

WASM_EXPORT void ecc_bn254_g1__neg(uint8_t const* point_buf, uint8_t* result)
{
    using serialize::write;
    auto point = from_buffer<bb::g1::affine_element>(point_buf);
    bb::g1::affine_element r = -point;
    write(result, r);
}

WASM_EXPORT void ecc_bn254_g1__eq(uint8_t const* point_a_buf, uint8_t const* point_b_buf, bool* result)
{
    auto point_a = from_buffer<bb::g1::affine_element>(point_a_buf);
    auto point_b = from_buffer<bb::g1::affine_element>(point_b_buf);
    *result = point_a == point_b;
}

WASM_EXPORT void ecc_bn254_g1__is_on_curve(uint8_t const* point_buf, bool* result)
{
    auto point = from_buffer<bb::g1::affine_element>(point_buf);
    *result = point.on_curve();
}

WASM_EXPORT void ecc_bn254_g1__batch_mul(uint8_t const* point_buf,
                                          uint8_t const* scalar_buf,
                                          uint32_t num_points,
                                          uint8_t* result)
{
    using serialize::write;
    std::vector<bb::g1::affine_element> points;
    points.reserve(num_points);
    for (size_t i = 0; i < num_points; ++i) {
        points.emplace_back(from_buffer<bb::g1::affine_element>(point_buf + (i * 64)));
    }
    auto scalar = from_buffer<bb::fr>(scalar_buf);
    auto output = bb::g1::element::batch_mul_with_endomorphism(points, scalar);
    for (size_t i = 0; i < num_points; ++i) {
        bb::g1::affine_element r = output[i];
        uint8_t* result_ptr = result + (i * 64);
        write(result_ptr, r);
    }
}

// ========== BN254 G2 curve operations ==========

WASM_EXPORT void ecc_bn254_g2__mul(uint8_t const* point_buf, uint8_t const* scalar_buf, uint8_t* result)
{
    using serialize::write;
    auto point = from_buffer<bb::g2::affine_element>(point_buf);
    auto scalar = from_buffer<bb::fr>(scalar_buf);
    bb::g2::affine_element r = point * scalar;
    write(result, r);
}

WASM_EXPORT void ecc_bn254_g2__add(uint8_t const* point_a_buf, uint8_t const* point_b_buf, uint8_t* result)
{
    using serialize::write;
    auto point_a = from_buffer<bb::g2::affine_element>(point_a_buf);
    auto point_b = from_buffer<bb::g2::affine_element>(point_b_buf);
    bb::g2::affine_element r = point_a + point_b;
    write(result, r);
}

WASM_EXPORT void ecc_bn254_g2__neg(uint8_t const* point_buf, uint8_t* result)
{
    using serialize::write;
    auto point = from_buffer<bb::g2::affine_element>(point_buf);
    bb::g2::affine_element r = -point;
    write(result, r);
}

WASM_EXPORT void ecc_bn254_g2__eq(uint8_t const* point_a_buf, uint8_t const* point_b_buf, bool* result)
{
    auto point_a = from_buffer<bb::g2::affine_element>(point_a_buf);
    auto point_b = from_buffer<bb::g2::affine_element>(point_b_buf);
    *result = point_a == point_b;
}

// NOLINTEND(cert-dcl37-c, cert-dcl51-cpp, bugprone-reserved-identifier)
