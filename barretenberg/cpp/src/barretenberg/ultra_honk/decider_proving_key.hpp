// === AUDIT STATUS ===
// internal:    { status: not started, auditors: [], date: YYYY-MM-DD }
// external_1:  { status: not started, auditors: [], date: YYYY-MM-DD }
// external_2:  { status: not started, auditors: [], date: YYYY-MM-DD }
// =====================

#pragma once
#include "barretenberg/common/log.hpp"
#include "barretenberg/ext/starknet/flavor/ultra_starknet_flavor.hpp"
#include "barretenberg/ext/starknet/flavor/ultra_starknet_zk_flavor.hpp"
#include "barretenberg/flavor/flavor.hpp"
#include "barretenberg/flavor/mega_zk_flavor.hpp"
#include "barretenberg/flavor/ultra_keccak_flavor.hpp"
#include "barretenberg/flavor/ultra_keccak_zk_flavor.hpp"
#include "barretenberg/flavor/ultra_rollup_flavor.hpp"
#include "barretenberg/flavor/ultra_zk_flavor.hpp"
#include "barretenberg/honk/composer/composer_lib.hpp"
#include "barretenberg/honk/composer/permutation_lib.hpp"
#include "barretenberg/honk/execution_trace/mega_execution_trace.hpp"
#include "barretenberg/honk/execution_trace/ultra_execution_trace.hpp"
#include "barretenberg/relations/relation_parameters.hpp"
#include "barretenberg/trace_to_polynomials/trace_to_polynomials.hpp"
#include <chrono>

namespace bb {
/**
 * @brief  A DeciderProvingKey is normally constructed from a finalized circuit and it contains all the information
 * required by an Mega Honk prover to create a proof. A DeciderProvingKey is also the result of running the
 * Protogalaxy prover, in which case it becomes a relaxed counterpart with the folding parameters (target sum and gate
 * challenges set to non-zero values).
 *
 * @details This is the equivalent of ω in the paper.
 */

template <IsUltraOrMegaHonk Flavor> class DeciderProvingKey_ {
    using Circuit = typename Flavor::CircuitBuilder;
    using ProvingKey = typename Flavor::ProvingKey;
    using CommitmentKey = typename Flavor::CommitmentKey;
    using FF = typename Flavor::FF;
    using ProverPolynomials = typename Flavor::ProverPolynomials;
    using Polynomial = typename Flavor::Polynomial;
    using RelationSeparator = typename Flavor::RelationSeparator;

    // Flag indicating whether the polynomials will be constructed with fixed block sizes for each gate type
    bool is_structured;

  public:
    using Trace = TraceToPolynomials<Flavor>;

    ProvingKey proving_key;

    bool is_accumulator = false;
    RelationSeparator alphas; // a challenge for each subrelation
    bb::RelationParameters<FF> relation_parameters;
    std::vector<FF> gate_challenges;
    // The target sum, which is typically nonzero for a ProtogalaxyProver's accmumulator
    FF target_sum{ 0 };
    size_t final_active_wire_idx{ 0 }; // idx of last non-trivial wire value in the trace
    size_t dyadic_circuit_size{ 0 };   // final power-of-2 circuit size

    size_t overflow_size{ 0 }; // size of the structured execution trace overflow

    DeciderProvingKey_(Circuit& circuit,
                       TraceSettings trace_settings = {},
                       CommitmentKey commitment_key = CommitmentKey())
        : is_structured(trace_settings.structure.has_value())
    {
        PROFILE_THIS_NAME("DeciderProvingKey(Circuit&)");
        vinfo("Constructing DeciderProvingKey");
        auto start = std::chrono::steady_clock::now();

        circuit.finalize_circuit(/* ensure_nonzero = */ true);

        // If using a structured trace, set fixed block sizes, check their validity, and set the dyadic circuit size
        if constexpr (std::same_as<Circuit, UltraCircuitBuilder>) {
            dyadic_circuit_size = compute_dyadic_size(circuit); // set dyadic size directly from circuit block sizes
        } else if (std::same_as<Circuit, MegaCircuitBuilder>) {
            if (is_structured) {
                circuit.blocks.set_fixed_block_sizes(trace_settings); // The structuring is set
                if (verbose_logging) {
                    circuit.blocks.summarize();
                }
                move_structured_trace_overflow_to_overflow_block(circuit);
                overflow_size = circuit.blocks.overflow.size();
                dyadic_circuit_size = compute_structured_dyadic_size(circuit); // set the dyadic size accordingly
            } else {
                dyadic_circuit_size = compute_dyadic_size(circuit); // set dyadic size directly from circuit block sizes
            }
        }

        circuit.blocks.compute_offsets(is_structured); // compute offset of each block within the trace

        // Find index of last non-trivial wire value in the trace
        for (auto& block : circuit.blocks.get()) {
            if (block.size() > 0) {
                final_active_wire_idx = block.trace_offset() + block.size() - 1;
            }
        }

        vinfo("allocating polynomials object in proving key...");
        {
            PROFILE_THIS_NAME("allocating proving key");

            proving_key = ProvingKey(dyadic_circuit_size, circuit.public_inputs.size(), commitment_key);
            // If not using structured trace OR if using structured trace but overflow has occurred (overflow block in
            // use), allocate full size polys
            // is_structured = false;
            if ((IsMegaFlavor<Flavor> && !is_structured) || (is_structured && circuit.blocks.has_overflow)) {
                // Allocate full size polynomials
                proving_key.polynomials = typename Flavor::ProverPolynomials(dyadic_circuit_size);
            } else { // Allocate only a correct amount of memory for each polynomial
                allocate_wires();

                allocate_permutation_argument_polynomials();

                allocate_selectors(circuit);

                allocate_table_lookup_polynomials(circuit);

                allocate_lagrange_polynomials();

                if constexpr (IsMegaFlavor<Flavor>) {
                    allocate_ecc_op_polynomials(circuit);
                }
                if constexpr (HasDataBus<Flavor>) {
                    allocate_databus_polynomials(circuit);
                }
            }
            // We can finally set the shifted polynomials now that all of the to_be_shifted polynomials are
            // defined.
            proving_key.polynomials.set_shifted(); // Ensure shifted wires are set correctly
        }

        // Construct and add to proving key the wire, selector and copy constraint polynomials
        vinfo("populating trace...");
        Trace::populate(circuit, proving_key);

        {
            PROFILE_THIS_NAME("constructing prover instance after trace populate");

            // If Goblin, construct the databus polynomials
            if constexpr (IsMegaFlavor<Flavor>) {
                PROFILE_THIS_NAME("constructing databus polynomials");

                construct_databus_polynomials(circuit);
            }
        }
        // Set the lagrange polynomials
        proving_key.polynomials.lagrange_first.at(0) = 1;
        proving_key.polynomials.lagrange_last.at(final_active_wire_idx) = 1;

        {
            PROFILE_THIS_NAME("constructing lookup table polynomials");

            construct_lookup_table_polynomials<Flavor>(
                proving_key.polynomials.get_tables(), circuit, dyadic_circuit_size, NUM_DISABLED_ROWS_IN_SUMCHECK);
        }

        {
            PROFILE_THIS_NAME("constructing lookup read counts");

            construct_lookup_read_counts<Flavor>(proving_key.polynomials.lookup_read_counts,
                                                 proving_key.polynomials.lookup_read_tags,
                                                 circuit,
                                                 dyadic_circuit_size);
        }
        { // Public inputs handling
            // Construct the public inputs array
            for (size_t i = 0; i < proving_key.num_public_inputs; ++i) {
                size_t idx = i + proving_key.pub_inputs_offset;
                proving_key.public_inputs.emplace_back(proving_key.polynomials.w_r[idx]);
            }

            // Set the pairing point accumulator indices. This should exist for all flavors.
            ASSERT(circuit.pairing_inputs_public_input_key.is_set() &&
                   "Honk circuit must output a pairing point accumulator. If this is a test, you might need to add a \
                   default one through a method in PairingPoints.");
            proving_key.pairing_inputs_public_input_key = circuit.pairing_inputs_public_input_key;

            if constexpr (HasIPAAccumulator<Flavor>) { // Set the IPA claim indices
                ASSERT(circuit.ipa_claim_public_input_key.is_set() && "Rollup Honk circuit must output a IPA claim.");
                ASSERT(circuit.ipa_proof.size() &&
                       "Rollup Honk circuit must produce an IPA proof to go with its claim.");
                proving_key.ipa_claim_public_input_key = circuit.ipa_claim_public_input_key;
                proving_key.ipa_proof = circuit.ipa_proof;
            }

            if constexpr (HasDataBus<Flavor>) { // Set databus commitment propagation data
                BB_ASSERT_EQ(circuit.databus_propagation_data.is_kernel,
                             circuit.databus_propagation_data.app_return_data_commitment_pub_input_key.is_set(),
                             "Mega circuit must output databus commitments.");
                BB_ASSERT_EQ(circuit.databus_propagation_data.is_kernel,
                             circuit.databus_propagation_data.app_return_data_commitment_pub_input_key.is_set(),
                             "Mega circuit must output databus commitments.");

                proving_key.databus_propagation_data = circuit.databus_propagation_data;
            }

            // Based on the flavor, we can check the locations of each backend-added public input object.
            if constexpr (HasIPAAccumulator<Flavor>) { // for Rollup flavors, we expect the public inputs to be:
                                                       // [user-public-inputs][pairing-point-object][ipa-claim]
                BB_ASSERT_EQ(proving_key.ipa_claim_public_input_key.start_idx,
                             proving_key.num_public_inputs - IPA_CLAIM_SIZE,
                             "IPA Claim must be the last IPA_CLAIM_SIZE public inputs.");
                BB_ASSERT_EQ(
                    proving_key.pairing_inputs_public_input_key.start_idx,
                    proving_key.num_public_inputs - IPA_CLAIM_SIZE - PAIRING_POINTS_SIZE,
                    "Pairing point accumulator must be the second to last public input object before the IPA claim.");
            } else if constexpr (IsUltraHonk<Flavor>) { // for Ultra flavors, we expect the public inputs to be:
                                                        // [user-public-inputs][pairing-point-object]
                BB_ASSERT_EQ(proving_key.pairing_inputs_public_input_key.start_idx,
                             proving_key.num_public_inputs - PAIRING_POINTS_SIZE,
                             "Pairing point accumulator must be the last public input object.");
            } else if constexpr (IsMegaFlavor<Flavor>) { // for Mega flavors, we expect the public inputs to be:
                                                         // [user-public-inputs][pairing-point-object][databus-comms]
                if (proving_key.databus_propagation_data.is_kernel) {

                    BB_ASSERT_EQ(
                        proving_key.databus_propagation_data.app_return_data_commitment_pub_input_key.start_idx,
                        proving_key.num_public_inputs - PROPAGATED_DATABUS_COMMITMENT_SIZE,
                        "Databus commitments must be the second to last public input object.");
                    BB_ASSERT_EQ(
                        proving_key.databus_propagation_data.kernel_return_data_commitment_pub_input_key.start_idx,
                        proving_key.num_public_inputs - PROPAGATED_DATABUS_COMMITMENTS_SIZE,
                        "Databus commitments must be the last public input object.");
                    BB_ASSERT_EQ(proving_key.pairing_inputs_public_input_key.start_idx,
                                 proving_key.num_public_inputs - PAIRING_POINTS_SIZE -
                                     PROPAGATED_DATABUS_COMMITMENTS_SIZE,
                                 "Pairing point accumulator must be the second to last public input object.");
                } else {
                    BB_ASSERT_EQ(proving_key.pairing_inputs_public_input_key.start_idx,
                                 proving_key.num_public_inputs - PAIRING_POINTS_SIZE,
                                 "Pairing point accumulator must be the last public input object.");
                }
            } else {
                // static_assert(false);
                ASSERT(false && "Dealing with unexpected flavor.");
            }
        }
        auto end = std::chrono::steady_clock::now();
        auto diff = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        vinfo("time to construct proving key: ", diff.count(), " ms.");
    }

    DeciderProvingKey_() = default;
    ~DeciderProvingKey_() = default;

    bool get_is_structured() { return is_structured; }

  private:
    static constexpr size_t num_zero_rows = Flavor::has_zero_row ? 1 : 0;
    static constexpr size_t NUM_WIRES = Circuit::NUM_WIRES;

    size_t compute_dyadic_size(Circuit&);

    void allocate_wires();

    void allocate_permutation_argument_polynomials();

    void allocate_lagrange_polynomials();

    void allocate_selectors(const Circuit&);

    void allocate_table_lookup_polynomials(const Circuit&);

    void allocate_ecc_op_polynomials(const Circuit&)
        requires IsMegaFlavor<Flavor>;

    void allocate_databus_polynomials(const Circuit&)
        requires HasDataBus<Flavor>;

    /**
     * @brief Compute dyadic size based on a structured trace with fixed block size
     *
     */
    size_t compute_structured_dyadic_size(Circuit& circuit) { return circuit.blocks.get_structured_dyadic_size(); }

    void construct_databus_polynomials(Circuit&)
        requires HasDataBus<Flavor>;

    static void move_structured_trace_overflow_to_overflow_block(Circuit& circuit)
        requires IsMegaFlavor<Flavor>;
};

} // namespace bb
