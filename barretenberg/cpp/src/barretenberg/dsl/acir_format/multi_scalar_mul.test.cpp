#include "multi_scalar_mul.hpp"
#include "acir_format.hpp"
#include "acir_format_mocks.hpp"
#include "acir_to_constraint_buf.hpp"
#include "barretenberg/numeric/uint256/uint256.hpp"

#include <cstdint>
#include <gtest/gtest.h>
#include <vector>

namespace acir_format::tests {

using namespace bb;

class MSMTests : public ::testing::Test {
  protected:
    static void SetUpTestSuite() { bb::srs::init_file_crs_factory(bb::srs::bb_crs_path()); }
};
using fr = field<Bn254FrParams>;

/**
 * @brief Create a circuit testing the a simple scalar mul with a constant generator
 *
 */
TEST_F(MSMTests, TestMSM)
{
    MultiScalarMul msm_constrain{
        .points = { WitnessOrConstant<fr>{
                        .index = 0,
                        .value = fr(1),
                        .is_constant = true,
                    },
                    WitnessOrConstant<fr>{
                        .index = 0,
                        .value = fr("0x0000000000000002cf135e7506a45d632d270d45f1181294833fc48d823f272c"),
                        .is_constant = true,
                    },
                    WitnessOrConstant<fr>{
                        .index = 0,
                        .value = fr(0),
                        .is_constant = true,
                    } },
        .scalars = { WitnessOrConstant<fr>{
                         .index = 0,
                         .value = fr(std::string("0x000000000000000000000000000000000000000000000000000000616c696365")),
                         .is_constant = false,
                     },
                     WitnessOrConstant<fr>{
                         .index = 0,
                         .value = fr(0),
                         .is_constant = true,
                     } },

        .out_point_x = 1,
        .out_point_y = 2,
        .out_point_is_infinite = 3,
    };

    AcirFormat constraint_system{
        .varnum = 9,
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
        .multi_scalar_mul_constraints = { msm_constrain },
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
        .block_constraints = {},
        .original_opcode_indices = create_empty_original_opcode_indices(),
    };
    mock_opcode_indices(constraint_system);

    WitnessVector witness{
        fr("0x000000000000000000000000000000000000000000000000000000616c696365"),
        fr("0x0bff8247aa94b08d1c680d7a3e10831bd8c8cf2ea2c756b0d1d89acdcad877ad"),
        fr("0x2a5d7253a6ed48462fedb2d350cc768d13956310f54e73a8a47914f34a34c5c4"),
        fr(0),
    };

    AcirProgram program{ constraint_system, witness };
    auto builder = create_circuit(program);

    EXPECT_TRUE(CircuitChecker::check(builder));
}

} // namespace acir_format::tests
