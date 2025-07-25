#include "block_constraint.hpp"
#include "acir_format.hpp"
#include "acir_format_mocks.hpp"

#include "barretenberg/flavor/mega_flavor.hpp"
#include "barretenberg/ultra_honk/ultra_prover.hpp"
#include "barretenberg/ultra_honk/ultra_verifier.hpp"

#include <gtest/gtest.h>
#include <vector>

using namespace acir_format;

class UltraPlonkRAM : public ::testing::Test {
  protected:
    static void SetUpTestSuite() { bb::srs::init_file_crs_factory(bb::srs::bb_crs_path()); }
};

class MegaHonk : public ::testing::Test {
  public:
    using Flavor = MegaFlavor;
    using Builder = Flavor::CircuitBuilder;
    using Prover = UltraProver_<Flavor>;
    using Verifier = UltraVerifier_<Flavor>;
    using VerificationKey = Flavor::VerificationKey;

    // Construct and verify an MegaHonk proof for the provided circuit
    static bool prove_and_verify(Builder& circuit)
    {
        auto proving_key = std::make_shared<DeciderProvingKey_<Flavor>>(circuit);
        auto verification_key = std::make_shared<VerificationKey>(proving_key->proving_key);
        Prover prover{ proving_key, verification_key };
        auto proof = prover.construct_proof();

        Verifier verifier{ verification_key };

        return verifier.verify_proof(proof);
    }

  protected:
    static void SetUpTestSuite() { bb::srs::init_file_crs_factory(bb::srs::bb_crs_path()); }
};
size_t generate_block_constraint(BlockConstraint& constraint, WitnessVector& witness_values)
{
    size_t witness_len = 0;
    witness_values.emplace_back(1);
    witness_len++;

    fr two = fr::one() + fr::one();
    poly_triple a0{
        .a = 0,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = two,
        .q_r = 0,
        .q_o = 0,
        .q_c = 0,
    };
    fr three = fr::one() + two;
    poly_triple a1{
        .a = 0,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = 0,
        .q_r = 0,
        .q_o = 0,
        .q_c = three,
    };
    poly_triple r1{
        .a = 0,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = fr::one(),
        .q_r = 0,
        .q_o = 0,
        .q_c = fr::neg_one(),
    };
    poly_triple r2{
        .a = 0,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = two,
        .q_r = 0,
        .q_o = 0,
        .q_c = fr::neg_one(),
    };
    poly_triple y{
        .a = 1,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = fr::one(),
        .q_r = 0,
        .q_o = 0,
        .q_c = 0,
    };
    witness_values.emplace_back(2);
    witness_len++;
    poly_triple z{
        .a = 2,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = fr::one(),
        .q_r = 0,
        .q_o = 0,
        .q_c = 0,
    };
    witness_values.emplace_back(3);
    witness_len++;
    MemOp op1{
        .access_type = 0,
        .index = r1,
        .value = y,
    };
    MemOp op2{
        .access_type = 0,
        .index = r2,
        .value = z,
    };
    constraint = BlockConstraint{
        .init = { a0, a1 },
        .trace = { op1, op2 },
        .type = BlockType::ROM,
    };

    return witness_len;
}

TEST_F(UltraPlonkRAM, TestBlockConstraint)
{
    BlockConstraint block;
    AcirProgram program;
    size_t num_variables = generate_block_constraint(block, program.witness);
    program.constraints = {
        .varnum = static_cast<uint32_t>(num_variables),
        .num_acir_opcodes = 7,
        .public_inputs = {},
        .logic_constraints = {},
        .range_constraints = {},
        .aes128_constraints = {},
        .sha256_compression = {},

        .ecdsa_k1_constraints = {},
        .ecdsa_r1_constraints = {},
        .blake2s_constraints = {},
        .blake3_constraints = {},
        .keccak_permutations = {},
        .poseidon2_constraints = {},
        .multi_scalar_mul_constraints = {},
        .ec_add_constraints = {},
        .recursion_constraints = {},
        .honk_recursion_constraints = {},
        .avm_recursion_constraints = {},
        .ivc_recursion_constraints = {},
        .bigint_from_le_bytes_constraints = {},
        .bigint_to_le_bytes_constraints = {},
        .bigint_operations = {},
        .assert_equalities = {},
        .poly_triple_constraints = {},
        .quad_constraints = {},
        .big_quad_constraints = {},
        .block_constraints = { block },
        .original_opcode_indices = create_empty_original_opcode_indices(),
    };
    mock_opcode_indices(program.constraints);

    auto builder = create_circuit(program);

    EXPECT_TRUE(CircuitChecker::check(builder));
}

TEST_F(MegaHonk, Databus)
{
    BlockConstraint block;
    AcirProgram program;
    size_t num_variables = generate_block_constraint(block, program.witness);
    block.type = BlockType::CallData;

    program.constraints = {
        .varnum = static_cast<uint32_t>(num_variables),
        .num_acir_opcodes = 1,
        .public_inputs = {},
        .logic_constraints = {},
        .range_constraints = {},
        .aes128_constraints = {},
        .sha256_compression = {},

        .ecdsa_k1_constraints = {},
        .ecdsa_r1_constraints = {},
        .blake2s_constraints = {},
        .blake3_constraints = {},
        .keccak_permutations = {},
        .poseidon2_constraints = {},
        .multi_scalar_mul_constraints = {},
        .ec_add_constraints = {},
        .recursion_constraints = {},
        .honk_recursion_constraints = {},
        .avm_recursion_constraints = {},
        .ivc_recursion_constraints = {},
        .bigint_from_le_bytes_constraints = {},
        .bigint_to_le_bytes_constraints = {},
        .bigint_operations = {},
        .assert_equalities = {},
        .poly_triple_constraints = {},
        .quad_constraints = {},
        .big_quad_constraints = {},
        .block_constraints = { block },
        .original_opcode_indices = create_empty_original_opcode_indices(),
    };
    mock_opcode_indices(program.constraints);

    // Construct a bberg circuit from the acir representation
    auto circuit = create_circuit<Builder>(program);

    EXPECT_TRUE(CircuitChecker::check(circuit));
}

TEST_F(MegaHonk, DatabusReturn)
{
    BlockConstraint block;
    AcirProgram program;
    size_t num_variables = generate_block_constraint(block, program.witness);
    block.type = BlockType::CallData;

    poly_triple rd_index{
        .a = static_cast<uint32_t>(num_variables),
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = 1,
        .q_r = 0,
        .q_o = 0,
        .q_c = 0,
    };
    program.witness.emplace_back(0);
    ++num_variables;
    auto fr_five = fr(5);
    poly_triple rd_read{
        .a = static_cast<uint32_t>(num_variables),
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = 1,
        .q_r = 0,
        .q_o = 0,
        .q_c = 0,
    };
    program.witness.emplace_back(fr_five);
    poly_triple five{
        .a = 0,
        .b = 0,
        .c = 0,
        .q_m = 0,
        .q_l = 0,
        .q_r = 0,
        .q_o = 0,
        .q_c = fr(fr_five),
    };
    ++num_variables;
    MemOp op_rd{
        .access_type = 0,
        .index = rd_index,
        .value = rd_read,
    };
    // Initialize the data_bus as [5] and read its value into rd_read
    auto return_data = BlockConstraint{
        .init = { five },
        .trace = { op_rd },
        .type = BlockType::ReturnData,
    };

    // Assert that call_data[0]+call_data[1] == return_data[0]
    poly_triple assert_equal{
        .a = 1,
        .b = 2,
        .c = rd_read.a,
        .q_m = 0,
        .q_l = 1,
        .q_r = 1,
        .q_o = fr::neg_one(),
        .q_c = 0,
    };

    program.constraints = {
        .varnum = static_cast<uint32_t>(num_variables),
        .num_acir_opcodes = 2,
        .public_inputs = {},
        .logic_constraints = {},
        .range_constraints = {},
        .aes128_constraints = {},
        .sha256_compression = {},

        .ecdsa_k1_constraints = {},
        .ecdsa_r1_constraints = {},
        .blake2s_constraints = {},
        .blake3_constraints = {},
        .keccak_permutations = {},
        .poseidon2_constraints = {},
        .multi_scalar_mul_constraints = {},
        .ec_add_constraints = {},
        .recursion_constraints = {},
        .honk_recursion_constraints = {},
        .avm_recursion_constraints = {},
        .ivc_recursion_constraints = {},
        .bigint_from_le_bytes_constraints = {},
        .bigint_to_le_bytes_constraints = {},
        .bigint_operations = {},
        .assert_equalities = {},
        .poly_triple_constraints = { assert_equal },
        .quad_constraints = {},
        .big_quad_constraints = {},
        .block_constraints = { block },
        .original_opcode_indices = create_empty_original_opcode_indices(),
    };
    mock_opcode_indices(program.constraints);

    // Construct a bberg circuit from the acir representation
    auto circuit = create_circuit<Builder>(program);

    EXPECT_TRUE(CircuitChecker::check(circuit));
}
