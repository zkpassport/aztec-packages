// === AUDIT STATUS ===
// internal:    { status: not started, auditors: [], date: YYYY-MM-DD }
// external_1:  { status: not started, auditors: [], date: YYYY-MM-DD }
// external_2:  { status: not started, auditors: [], date: YYYY-MM-DD }
// =====================

#pragma once

/**
 * @brief Provides interfaces for different PCS 'VerificationKey' classes.
 *
 */

#include "barretenberg/commitment_schemes/commitment_key.hpp"
#include "barretenberg/ecc/curves/bn254/bn254.hpp"
#include "barretenberg/ecc/curves/bn254/pairing.hpp"
#include "barretenberg/ecc/curves/grumpkin/grumpkin.hpp"
#include "barretenberg/ecc/scalar_multiplication/scalar_multiplication.hpp"
#include "barretenberg/numeric/bitop/pow.hpp"
#include "barretenberg/polynomials/polynomial_arithmetic.hpp"
#include "barretenberg/srs/global_crs.hpp"

#include <cstddef>
#include <memory>
#include <string_view>

namespace bb {

template <class Curve> class VerifierCommitmentKey;

/**
 * @brief Specialization for bn254
 *
 * @tparam curve::BN254
 */
template <> class VerifierCommitmentKey<curve::BN254> {
  public:
    using Curve = curve::BN254;
    using GroupElement = typename Curve::Element;
    using Commitment = typename Curve::AffineElement;

    VerifierCommitmentKey() = default;

    void initialize()
    {
        if (!srs) {
            srs = srs::get_crs_factory<Curve>()->get_verifier_crs();
        }
    };
    bool operator==(const VerifierCommitmentKey&) const = default;

    bool initialized() const { return srs != nullptr; }

    Commitment get_g1_identity()
    {
        initialize();
        return srs->get_g1_identity();
    }

    /**
     * @brief verifies a pairing equation over 2 points using the verifier SRS
     *
     * @param p0 = P₀
     * @param p1 = P₁
     * @return e(P₀,[1]₁)e(P₁,[x]₂) ≡ [1]ₜ
     */
    bool pairing_check(const GroupElement& p0, const GroupElement& p1)
    {
        initialize();
        Commitment pairing_points[2]{ p0, p1 };
        // The final pairing check of step 12.
        Curve::TargetField result =
            bb::pairing::reduced_ate_pairing_batch_precomputed(pairing_points, srs->get_precomputed_g2_lines(), 2);

        return (result == Curve::TargetField::one());
    }

  private:
    std::shared_ptr<bb::srs::factories::Crs<Curve>> srs;
};

/**
 * @brief Specialization for Grumpkin
 *
 * @tparam curve::Grumpkin
 */
template <> class VerifierCommitmentKey<curve::Grumpkin> {
  public:
    using Curve = curve::Grumpkin;
    using GroupElement = typename Curve::Element;
    using Commitment = typename Curve::AffineElement;

    /**
     * @brief Construct a new IPA Verification Key object from existing SRS
     *
     *
     * @param num_points specifies the length of the SRS
     * @param path is the location to the SRS file
     */
    VerifierCommitmentKey(size_t num_points, const std::shared_ptr<bb::srs::factories::CrsFactory<Curve>>& crs_factory)
        : srs(crs_factory->get_crs(num_points))
    {}

    VerifierCommitmentKey(size_t num_points) { srs = srs::get_crs_factory<Curve>()->get_crs(num_points); }

    VerifierCommitmentKey() = default;

    bool operator==(const VerifierCommitmentKey&) const = default;

    bool initialized() const { return srs != nullptr; }

    Commitment get_g1_identity() const { return srs->get_g1_identity(); }

    std::span<const Commitment> get_monomial_points() const { return srs->get_monomial_points(); }

  private:
    std::shared_ptr<bb::srs::factories::Crs<Curve>> srs;
};

} // namespace bb
