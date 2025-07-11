import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { type InitialAccountData, deployFundedSchnorrAccount } from '@aztec/accounts/testing';
// docs:start:import_aztecjs
import { type AztecAddress, type AztecNode, Fr, type Logger, type PXE, type Wallet, sleep } from '@aztec/aztec.js';
import { TokenContract } from '@aztec/noir-contracts.js/Token';
// docs:end:import_aztecjs
import { ChildContract } from '@aztec/noir-test-contracts.js/Child';

import { expect, jest } from '@jest/globals';

import { deployToken, expectTokenBalance, mintTokensToPrivate } from './fixtures/token_utils.js';
import { setup, setupPXEService } from './fixtures/utils.js';

const TIMEOUT = 300_000;

describe('e2e_2_pxes', () => {
  jest.setTimeout(TIMEOUT);

  let aztecNode: AztecNode | undefined;
  let pxeA: PXE;
  let pxeB: PXE;
  let walletA: Wallet;
  let walletB: Wallet;
  let initialFundedAccounts: InitialAccountData[];
  let logger: Logger;
  let teardownA: () => Promise<void>;
  let teardownB: () => Promise<void>;

  beforeEach(async () => {
    ({
      aztecNode,
      pxe: pxeA,
      initialFundedAccounts,
      wallet: walletA,
      logger,
      teardown: teardownA,
    } = await setup(1, { numberOfInitialFundedAccounts: 3 }));

    // Account A is already deployed in setup

    // Deploy accountB via pxeB.
    ({ pxe: pxeB, teardown: teardownB } = await setupPXEService(aztecNode!, {}, undefined, true));
    const accountB = await deployFundedSchnorrAccount(pxeB, initialFundedAccounts[1]);
    walletB = await accountB.getWallet();

    /*TODO(post-honk): We wait 5 seconds for a race condition in setting up two nodes.
     What is a more robust solution? */
    await sleep(5000);

    await walletA.registerSender(walletB.getAddress());
    await walletB.registerSender(walletA.getAddress());
  });

  afterEach(async () => {
    await teardownB();
    await teardownA();
  });

  it('transfers funds from user A to B via PXE A followed by transfer from B to A via PXE B', async () => {
    const initialBalance = 987n;
    const transferAmount1 = 654n;
    const transferAmount2 = 323n;

    const token = await deployToken(walletA, initialBalance, logger);

    // Add token to PXE B (PXE A already has it because it was deployed through it)
    await pxeB.registerContract(token);

    // Check initial balances are as expected
    await expectTokenBalance(walletA, token, walletA.getAddress(), initialBalance, logger);
    await expectTokenBalance(walletB, token, walletB.getAddress(), 0n, logger);

    // Transfer funds from A to B via PXE A
    const contractWithWalletA = await TokenContract.at(token.address, walletA);
    await contractWithWalletA.methods.transfer(walletB.getAddress(), transferAmount1).send().wait();

    // Check balances are as expected
    await expectTokenBalance(walletA, token, walletA.getAddress(), initialBalance - transferAmount1, logger);
    await expectTokenBalance(walletB, token, walletB.getAddress(), transferAmount1, logger);

    // Transfer funds from B to A via PXE B
    const contractWithWalletB = await TokenContract.at(token.address, walletB);
    await contractWithWalletB.methods.transfer(walletA.getAddress(), transferAmount2).send().wait({ interval: 0.1 });

    // Check balances are as expected
    await expectTokenBalance(
      walletA,
      token,
      walletA.getAddress(),
      initialBalance - transferAmount1 + transferAmount2,
      logger,
    );
    await expectTokenBalance(walletB, token, walletB.getAddress(), transferAmount1 - transferAmount2, logger);
  });

  const deployChildContractViaServerA = async () => {
    logger.info(`Deploying Child contract...`);
    const contract = await ChildContract.deploy(walletA).send().deployed();
    logger.info('Child contract deployed');

    return contract.instance;
  };

  const getChildStoredValue = (child: { address: AztecAddress }, pxe: PXE) =>
    pxe.getPublicStorageAt(child.address, new Fr(1));

  it('user calls a public function on a contract deployed by a different user using a different PXE', async () => {
    const childCompleteAddress = await deployChildContractViaServerA();

    // Add Child to PXE B
    await pxeB.registerContract({
      artifact: ChildContract.artifact,
      instance: childCompleteAddress,
    });

    const newValueToSet = new Fr(256n);

    const childContractWithWalletB = await ChildContract.at(childCompleteAddress.address, walletB);
    await childContractWithWalletB.methods.pub_inc_value(newValueToSet).send().wait({ interval: 0.1 });

    const storedValueOnB = await getChildStoredValue(childCompleteAddress, pxeB);
    expect(storedValueOnB).toEqual(newValueToSet);

    const storedValueOnA = await getChildStoredValue(childCompleteAddress, pxeA);
    expect(storedValueOnA).toEqual(newValueToSet);
  });

  it('private state is "zero" when PXE does not have the account secret key', async () => {
    const userABalance = 100n;
    const userBBalance = 150n;

    const token = await deployToken(walletA, userABalance, logger);

    // Add token to PXE B (PXE A already has it because it was deployed through it)
    await pxeB.registerContract(token);

    // Mint tokens to user B
    await mintTokensToPrivate(token, walletA, walletB.getAddress(), userBBalance);

    // Check that user A balance is 100 on server A
    await expectTokenBalance(walletA, token, walletA.getAddress(), userABalance, logger);
    // Check that user B balance is 150 on server B
    await expectTokenBalance(walletB, token, walletB.getAddress(), userBBalance, logger);

    // CHECK THAT PRIVATE BALANCES ARE 0 WHEN ACCOUNT'S SECRET KEYS ARE NOT REGISTERED
    // Check that user A balance is 0 on server B
    await expectTokenBalance(walletB, token, walletA.getAddress(), 0n, logger);
    // Check that user B balance is 0 on server A
    await expectTokenBalance(walletA, token, walletB.getAddress(), 0n, logger);
  });

  it('permits sending funds to a user before they have registered the contract', async () => {
    const initialBalance = 987n;
    const transferAmount1 = 654n;

    const token = await deployToken(walletA, initialBalance, logger);

    // Check initial balances are as expected
    await expectTokenBalance(walletA, token, walletA.getAddress(), initialBalance, logger);
    // don't check userB yet

    // Transfer funds from A to B via PXE A
    const contractWithWalletA = await TokenContract.at(token.address, walletA);
    await contractWithWalletA.methods.transfer(walletB.getAddress(), transferAmount1).send().wait();

    // now add the contract and check balances
    await pxeB.registerContract(token);
    await expectTokenBalance(walletA, token, walletA.getAddress(), initialBalance - transferAmount1, logger);
    await expectTokenBalance(walletB, token, walletB.getAddress(), transferAmount1, logger);
  });

  it('permits sending funds to a user, and spending them, before they have registered the contract', async () => {
    const initialBalance = 987n;
    const transferAmount1 = 654n;
    const transferAmount2 = 323n;

    // setup an account that is shared across PXEs
    const sharedAccount = initialFundedAccounts[2];
    const sharedAccountOnA = await deployFundedSchnorrAccount(pxeA, sharedAccount);
    const sharedWalletOnA = await sharedAccountOnA.getWallet();
    const sharedAccountAddress = sharedWalletOnA.getAddress();
    await sharedWalletOnA.registerSender(walletA.getAddress());

    // Register the shared account on pxeB.
    const sharedAccountOnB = await getSchnorrAccount(
      pxeB,
      sharedAccount.secret,
      sharedAccount.signingKey,
      sharedAccount.salt,
    );
    await sharedAccountOnB.register();
    const sharedWalletOnB = await sharedAccountOnB.getWallet();

    await sharedWalletOnB.registerSender(sharedAccountAddress);

    // deploy the contract on PXE A
    const token = await deployToken(walletA, initialBalance, logger);

    // Transfer funds from A to Shared Wallet via PXE A
    const contractWithWalletA = await TokenContract.at(token.address, walletA);
    await contractWithWalletA.methods.transfer(sharedAccountAddress, transferAmount1).send().wait();

    // Now send funds from Shared Wallet to B via PXE A
    const contractWithSharedWalletA = await TokenContract.at(token.address, sharedWalletOnA);
    await contractWithSharedWalletA.methods.transfer(walletB.getAddress(), transferAmount2).send().wait();

    // check balances from PXE-A's perspective
    await expectTokenBalance(walletA, token, walletA.getAddress(), initialBalance - transferAmount1, logger);
    await expectTokenBalance(sharedWalletOnA, token, sharedAccountAddress, transferAmount1 - transferAmount2, logger);

    // now add the contract and check balances from PXE-B's perspective.
    // The process should be:
    // PXE-B had previously deferred the notes from A -> Shared, and Shared -> B
    // PXE-B adds the contract
    // PXE-B reprocesses the deferred notes, and sees the nullifier for A -> Shared
    await pxeB.registerContract(token);
    await expectTokenBalance(walletB, token, walletB.getAddress(), transferAmount2, logger);
    await expectTokenBalance(sharedWalletOnB, token, sharedAccountAddress, transferAmount1 - transferAmount2, logger);
  });
});
