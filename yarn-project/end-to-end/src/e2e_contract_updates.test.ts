import { getSchnorrAccountContractAddress } from '@aztec/accounts/schnorr';
import { type AztecNode, Fr, type Wallet, getContractClassFromArtifact } from '@aztec/aztec.js';
import { registerContractClass } from '@aztec/aztec.js/deployment';
import { MINIMUM_UPDATE_DELAY, UPDATED_CLASS_IDS_SLOT } from '@aztec/constants';
import { getL1ContractsConfigEnvVars } from '@aztec/ethereum';
import { UpdatableContract } from '@aztec/noir-test-contracts.js/Updatable';
import { UpdatedContract, UpdatedContractArtifact } from '@aztec/noir-test-contracts.js/Updated';
import { ProtocolContractAddress } from '@aztec/protocol-contracts';
import type { AztecAddress } from '@aztec/stdlib/aztec-address';
import { getContractInstanceFromDeployParams } from '@aztec/stdlib/contract';
import { computePublicDataTreeLeafSlot, deriveStorageSlotInMap } from '@aztec/stdlib/hash';
import { deriveSigningKey } from '@aztec/stdlib/keys';
import { ScheduledDelayChange, ScheduledValueChange, SharedMutableValuesWithHash } from '@aztec/stdlib/shared-mutable';
import { PublicDataTreeLeaf } from '@aztec/stdlib/trees';
import type { UInt64 } from '@aztec/stdlib/types';

import { setup } from './fixtures/utils.js';

// Set the update delay in genesis data so it's feasible to test in an e2e test
const { aztecSlotDuration } = getL1ContractsConfigEnvVars();
const DEFAULT_TEST_UPDATE_DELAY = BigInt(aztecSlotDuration) * 10n;

describe('e2e_contract_updates', () => {
  let wallet: Wallet;
  let aztecNode: AztecNode;
  let teardown: () => Promise<void>;
  let contract: UpdatableContract;
  let updatedContractClassId: Fr;

  const setupScheduledDelay = async (constructorArgs: any[], salt: Fr, deployer: AztecAddress) => {
    const predictedInstance = await getContractInstanceFromDeployParams(UpdatableContract.artifact, {
      constructorArgs,
      salt,
      deployer,
    });

    const sharedMutableSlot = await deriveStorageSlotInMap(new Fr(UPDATED_CLASS_IDS_SLOT), predictedInstance.address);

    const leaves: PublicDataTreeLeaf[] = [];

    const writeToTree = async (storageSlot: Fr, value: Fr) => {
      leaves.push(
        new PublicDataTreeLeaf(
          await computePublicDataTreeLeafSlot(ProtocolContractAddress.ContractInstanceDeployer, storageSlot),
          value,
        ),
      );
    };

    const valueChange = ScheduledValueChange.empty(1);
    const delayChange = new ScheduledDelayChange(undefined, DEFAULT_TEST_UPDATE_DELAY, 0n);
    const sharedMutableValuesWithHash = new SharedMutableValuesWithHash(valueChange, delayChange);

    await sharedMutableValuesWithHash.writeToTree(sharedMutableSlot, writeToTree);

    return leaves;
  };

  beforeEach(async () => {
    const senderPrivateKey = Fr.random();
    const signingKey = deriveSigningKey(senderPrivateKey);
    const salt = Fr.ONE;
    const initialFundedAccounts = [
      {
        secret: senderPrivateKey,
        signingKey,
        salt,
        address: await getSchnorrAccountContractAddress(senderPrivateKey, salt, signingKey),
      },
    ];

    const constructorArgs = [1n];
    const genesisPublicData = await setupScheduledDelay(constructorArgs, salt, initialFundedAccounts[0].address);

    ({ teardown, wallet, aztecNode } = await setup(1, {
      genesisPublicData,
      initialFundedAccounts,
    }));

    contract = await UpdatableContract.deploy(wallet, constructorArgs[0])
      .send({ contractAddressSalt: salt })
      .deployed();

    const registerMethod = await registerContractClass(wallet, UpdatedContractArtifact);
    await registerMethod.send().wait();

    updatedContractClassId = (await getContractClassFromArtifact(UpdatedContractArtifact)).id;
  });

  const mineBlocksToAdvanceTimestampAtLeastBy = async (duration: UInt64) => {
    const initialTimestamp = (await aztecNode.getBlockHeader('latest'))!.globalVariables.timestamp;
    while (true) {
      const { blockNumber } = await contract.methods.get_update_delay().send().wait();
      // We get the latest block header and check if the timestamp is at least "initial timestamp + duration"
      const header = await aztecNode.getBlockHeader(blockNumber);
      if (header!.globalVariables.timestamp >= initialTimestamp + duration) {
        break;
      }
    }
  };

  afterEach(() => teardown());

  it('should update the contract', async () => {
    expect(await contract.methods.get_private_value().simulate()).toEqual(1n);
    expect(await contract.methods.get_public_value().simulate()).toEqual(1n);
    await contract.methods.update_to(updatedContractClassId).send().wait();
    // Mine some blocks
    await mineBlocksToAdvanceTimestampAtLeastBy(DEFAULT_TEST_UPDATE_DELAY);
    // Should be updated now
    const updatedContract = await UpdatedContract.at(contract.address, wallet);
    // Call a private method that wasn't available in the previous contract
    await updatedContract.methods.set_private_value().send().wait();
    // Read state that was changed by the previous tx
    expect(await updatedContract.methods.get_private_value().simulate()).toEqual(27n);

    // Call a public method with a new implementation
    await updatedContract.methods.set_public_value().send().wait();
    expect(await updatedContract.methods.get_public_value().simulate()).toEqual(27n);
  });

  it('should change the update delay and then update the contract', async () => {
    expect(await contract.methods.get_update_delay().simulate()).toEqual(BigInt(DEFAULT_TEST_UPDATE_DELAY));

    // Increases the delay so it should happen immediately
    await contract.methods
      .set_update_delay(BigInt(MINIMUM_UPDATE_DELAY) + 1n)
      .send()
      .wait();

    expect(await contract.methods.get_update_delay().simulate()).toEqual(BigInt(MINIMUM_UPDATE_DELAY) + 1n);

    await contract.methods.update_to(updatedContractClassId).send().wait();
    await mineBlocksToAdvanceTimestampAtLeastBy(BigInt(MINIMUM_UPDATE_DELAY) + 1n);

    // Should be updated now
    const updatedContract = await UpdatedContract.at(contract.address, wallet);
    // Call a private method that wasn't available in the previous contract
    await updatedContract.methods.set_private_value().send().wait();
  });

  it('should not allow to change the delay to a value lower than the minimum', async () => {
    await expect(contract.methods.set_update_delay(BigInt(MINIMUM_UPDATE_DELAY) - 1n).simulate()).rejects.toThrow(
      'New update delay is too low',
    );
  });

  it('should not allow to instantiate a contract with an updated class before the update happens', async () => {
    await expect(UpdatedContract.at(contract.address, wallet)).rejects.toThrow(
      'Could not update contract to a class different from the current one',
    );
  });
});
