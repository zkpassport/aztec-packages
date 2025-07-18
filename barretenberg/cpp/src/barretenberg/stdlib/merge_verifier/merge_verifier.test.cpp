#include "barretenberg/ultra_honk/merge_verifier.hpp"
#include "barretenberg/circuit_checker/circuit_checker.hpp"
#include "barretenberg/common/test.hpp"
#include "barretenberg/goblin/mock_circuits.hpp"
#include "barretenberg/stdlib/merge_verifier/merge_recursive_verifier.hpp"
#include "barretenberg/stdlib/primitives/curves/bn254.hpp"
#include "barretenberg/ultra_honk/merge_prover.hpp"
#include "barretenberg/ultra_honk/ultra_prover.hpp"
#include "barretenberg/ultra_honk/ultra_verifier.hpp"

namespace bb::stdlib::recursion::goblin {

/**
 * @brief Test suite for recursive verification of Goblin Merge proofs
 * @details The recursive verification circuit is arithmetized using Goblin-style Ultra arithmetization
 * (MegaCircuitBuilder).
 *
 * @tparam Builder
 */
template <class RecursiveBuilder> class RecursiveMergeVerifierTest : public testing::Test {

    // Types for recursive verifier circuit
    using RecursiveMergeVerifier = MergeRecursiveVerifier_<RecursiveBuilder>;

    // Define types relevant for inner circuit
    using InnerFlavor = MegaFlavor;
    using InnerDeciderProvingKey = DeciderProvingKey_<InnerFlavor>;
    using InnerBuilder = typename InnerFlavor::CircuitBuilder;

    // Define additional types for testing purposes
    using Commitment = InnerFlavor::Commitment;
    using FF = InnerFlavor::FF;
    using VerifierCommitmentKey = bb::VerifierCommitmentKey<curve::BN254>;

  public:
    static void SetUpTestSuite() { bb::srs::init_file_crs_factory(bb::srs::bb_crs_path()); }

    /**
     * @brief Test recursive merge verification for the ops generated by a sample circuit
     * @details We construct and verify an Ultra Honk proof of the recursive merge verifier circuit to check its
     * correctness rather than calling check_circuit since this functionality is incomplete for the Goblin
     * arithmetization
     */
    static void test_recursive_merge_verification()
    {
        auto op_queue = std::make_shared<ECCOpQueue>();

        InnerBuilder sample_circuit{ op_queue };
        GoblinMockCircuits::construct_simple_circuit(sample_circuit);

        RecursiveBuilder outer_circuit;

        MergeProver merge_prover{ op_queue };

        // Subtable values and commitments - needed for (Recursive)MergeVerifier
        auto t_current = op_queue->construct_current_ultra_ops_subtable_columns();
        std::array<Commitment, InnerFlavor::NUM_WIRES> t_commitments_val;
        std::array<typename RecursiveMergeVerifier::Commitment, InnerFlavor::NUM_WIRES> t_commitments_rec_val;
        for (size_t idx = 0; idx < InnerFlavor::NUM_WIRES; idx++) {
            t_commitments_val[idx] = merge_prover.pcs_commitment_key.commit(t_current[idx]);
            t_commitments_rec_val[idx] =
                RecursiveMergeVerifier::Commitment::from_witness(&outer_circuit, t_commitments_val[idx]);
        }

        RefArray<Commitment, InnerFlavor::NUM_WIRES> t_commitments(t_commitments_val);
        RefArray<typename RecursiveMergeVerifier::Commitment, InnerFlavor::NUM_WIRES> t_commitments_rec(
            t_commitments_rec_val);

        // Construct Merge proof
        auto merge_proof = merge_prover.construct_proof();

        // Create a recursive merge verification circuit for the merge proof
        RecursiveMergeVerifier verifier{ &outer_circuit };
        const StdlibProof<RecursiveBuilder> stdlib_merge_proof =
            bb::convert_native_proof_to_stdlib(&outer_circuit, merge_proof);
        auto pairing_points = verifier.verify_proof(stdlib_merge_proof, t_commitments_rec);

        // Check for a failure flag in the recursive verifier circuit
        EXPECT_EQ(outer_circuit.failed(), false) << outer_circuit.err();

        // Check 1: Perform native merge verification then perform the pairing on the outputs of the recursive merge
        // verifier and check that the result agrees.
        MergeVerifier native_verifier;
        bool verified_native = native_verifier.verify_proof(merge_proof, t_commitments);
        VerifierCommitmentKey pcs_verification_key;
        auto verified_recursive =
            pcs_verification_key.pairing_check(pairing_points.P0.get_value(), pairing_points.P1.get_value());
        EXPECT_EQ(verified_native, verified_recursive);
        EXPECT_TRUE(verified_recursive);

        // Check 2: Ensure that the underlying native and recursive merge verification algorithms agree by ensuring
        // the manifests produced by each agree.
        auto recursive_manifest = verifier.transcript->get_manifest();
        auto native_manifest = native_verifier.transcript->get_manifest();
        for (size_t i = 0; i < recursive_manifest.size(); ++i) {
            EXPECT_EQ(recursive_manifest[i], native_manifest[i]);
        }

        // Check the recursive merge verifier circuit
        CircuitChecker::check(outer_circuit);
    }
};

using Builders = testing::Types<MegaCircuitBuilder, UltraCircuitBuilder>;

TYPED_TEST_SUITE(RecursiveMergeVerifierTest, Builders);

TYPED_TEST(RecursiveMergeVerifierTest, SingleRecursiveVerification)
{
    TestFixture::test_recursive_merge_verification();
};

} // namespace bb::stdlib::recursion::goblin
