#include "barretenberg/vm2/simulation/lib/raw_data_dbs.hpp"
#include "barretenberg/common/log.hpp"
#include "barretenberg/vm2/simulation/lib/contract_crypto.hpp"

#include <cassert>
#include <optional>

namespace bb::avm2::simulation {

// HintedRawContractDB starts.
HintedRawContractDB::HintedRawContractDB(const ExecutionHints& hints)
{
    vinfo("Initializing HintedRawContractDB with ",
          hints.contractInstances.size(),
          " contract instances, ",
          hints.contractClasses.size(),
          " contract classes, and ",
          hints.bytecodeCommitments.size(),
          " bytecode commitments.");

    for (const auto& contract_instance_hint : hints.contractInstances) {
        // TODO(fcarreiro): We are currently generating duplicates in TS.
        // assert(!contract_instances.contains(contract_instance_hint.address));
        contract_instances[contract_instance_hint.address] = contract_instance_hint;
    }

    for (const auto& contract_class_hint : hints.contractClasses) {
        // TODO(fcarreiro): We are currently generating duplicates in TS.
        // assert(!contract_classes.contains(contract_class_hint.classId));
        contract_classes[contract_class_hint.classId] = contract_class_hint;
    }

    for (const auto& bytecode_commitment_hint : hints.bytecodeCommitments) {
        // TODO(fcarreiro): We are currently generating duplicates in TS.
        // assert(!bytecode_commitments.contains(bytecode_commitment_hint.classId));
        bytecode_commitments[bytecode_commitment_hint.classId] = bytecode_commitment_hint.commitment;
    }
}

std::optional<ContractInstance> HintedRawContractDB::get_contract_instance(const AztecAddress& address) const
{
    auto it = contract_instances.find(address);
    // If we don't find the instance hint, this is not a catastrohic failure. It means that on the TS side,
    // the instance was also not found, and should be handled.
    if (it == contract_instances.end()) {
        vinfo("Contract instance not found: ", address);
        return std::nullopt;
    }
    const auto& contract_instance_hint = it->second;

    return std::make_optional<ContractInstance>({
        .salt = contract_instance_hint.salt,
        .deployer_addr = contract_instance_hint.deployer,
        .contract_class_id = contract_instance_hint.originalContractClassId,
        .initialisation_hash = contract_instance_hint.initializationHash,
        .public_keys =
            PublicKeys{
                .nullifier_key = contract_instance_hint.publicKeys.masterNullifierPublicKey,
                .incoming_viewing_key = contract_instance_hint.publicKeys.masterIncomingViewingPublicKey,
                .outgoing_viewing_key = contract_instance_hint.publicKeys.masterOutgoingViewingPublicKey,
                .tagging_key = contract_instance_hint.publicKeys.masterTaggingPublicKey,
            },
    });
}

std::optional<ContractClass> HintedRawContractDB::get_contract_class(const ContractClassId& class_id) const
{
    auto it = contract_classes.find(class_id);
    // If we don't find the class hint, this is not a catastrohic failure. It means that on the TS side,
    // the class was also not found, and should be handled.
    if (it == contract_classes.end()) {
        vinfo("Contract class not found: ", class_id);
        return std::nullopt;
    }
    const auto& contract_class_hint = it->second;

    return std::make_optional<ContractClass>({
        .artifact_hash = contract_class_hint.artifactHash,
        .private_function_root = contract_class_hint.privateFunctionsRoot,
        // We choose to embed the bytecode commitment in the contract class.
        .public_bytecode_commitment = get_bytecode_commitment(class_id),
        .packed_bytecode = contract_class_hint.packedBytecode,
    });
}

FF HintedRawContractDB::get_bytecode_commitment(const ContractClassId& class_id) const
{
    assert(bytecode_commitments.contains(class_id));
    return bytecode_commitments.at(class_id);
}

// Hinted MerkleDB starts.
HintedRawMerkleDB::HintedRawMerkleDB(const ExecutionHints&, const TreeSnapshots& tree_roots)
    : tree_roots(tree_roots)
{}

} // namespace bb::avm2::simulation
