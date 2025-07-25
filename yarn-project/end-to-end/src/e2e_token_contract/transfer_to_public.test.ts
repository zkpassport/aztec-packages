import { Fr, computeAuthWitMessageHash } from '@aztec/aztec.js';

import { DUPLICATE_NULLIFIER_ERROR } from '../fixtures/fixtures.js';
import { TokenContractTest } from './token_contract_test.js';

describe('e2e_token_contract transfer_to_public', () => {
  const t = new TokenContractTest('transfer_to_public');
  let { asset, accounts, tokenSim, wallets } = t;

  beforeAll(async () => {
    await t.applyBaseSnapshots();
    await t.applyMintSnapshot();
    await t.setup();
    // Have to destructure again to ensure we have latest refs.
    ({ asset, accounts, tokenSim, wallets } = t);
  });

  afterAll(async () => {
    await t.teardown();
  });

  afterEach(async () => {
    await t.tokenSim.check();
  });

  it('on behalf of self', async () => {
    const balancePriv = await asset.methods.balance_of_private(accounts[0].address).simulate();
    const amount = balancePriv / 2n;
    expect(amount).toBeGreaterThan(0n);

    await asset.methods.transfer_to_public(accounts[0].address, accounts[0].address, amount, 0).send().wait();

    tokenSim.transferToPublic(accounts[0].address, accounts[0].address, amount);
  });

  it('on behalf of other', async () => {
    const balancePriv0 = await asset.methods.balance_of_private(accounts[0].address).simulate();
    const amount = balancePriv0 / 2n;
    const authwitNonce = Fr.random();
    expect(amount).toBeGreaterThan(0n);

    // We need to compute the message we want to sign and add it to the wallet as approved
    const action = asset
      .withWallet(wallets[1])
      .methods.transfer_to_public(accounts[0].address, accounts[1].address, amount, authwitNonce);

    // Both wallets are connected to same node and PXE so we could just insert directly
    // But doing it in two actions to show the flow.
    const witness = await wallets[0].createAuthWit({ caller: accounts[1].address, action });

    await action.send({ authWitnesses: [witness] }).wait();
    tokenSim.transferToPublic(accounts[0].address, accounts[1].address, amount);

    // Perform the transfer again, should fail
    const txReplay = asset
      .withWallet(wallets[1])
      .methods.transfer_to_public(accounts[0].address, accounts[1].address, amount, authwitNonce)
      .send({ authWitnesses: [witness] });
    await expect(txReplay.wait()).rejects.toThrow(DUPLICATE_NULLIFIER_ERROR);
  });

  describe('failure cases', () => {
    it('on behalf of self (more than balance)', async () => {
      const balancePriv = await asset.methods.balance_of_private(accounts[0].address).simulate();
      const amount = balancePriv + 1n;
      expect(amount).toBeGreaterThan(0n);

      await expect(
        asset.methods.transfer_to_public(accounts[0].address, accounts[0].address, amount, 0).simulate(),
      ).rejects.toThrow('Assertion failed: Balance too low');
    });

    it('on behalf of self (invalid authwit nonce)', async () => {
      const balancePriv = await asset.methods.balance_of_private(accounts[0].address).simulate();
      const amount = balancePriv + 1n;
      expect(amount).toBeGreaterThan(0n);

      await expect(
        asset.methods.transfer_to_public(accounts[0].address, accounts[0].address, amount, 1).simulate(),
      ).rejects.toThrow('Assertion failed: invalid authwit nonce');
    });

    it('on behalf of other (more than balance)', async () => {
      const balancePriv0 = await asset.methods.balance_of_private(accounts[0].address).simulate();
      const amount = balancePriv0 + 2n;
      const authwitNonce = Fr.random();
      expect(amount).toBeGreaterThan(0n);

      // We need to compute the message we want to sign and add it to the wallet as approved
      const action = asset
        .withWallet(wallets[1])
        .methods.transfer_to_public(accounts[0].address, accounts[1].address, amount, authwitNonce);

      // Both wallets are connected to same node and PXE so we could just insert directly
      // But doing it in two actions to show the flow.
      const witness = await wallets[0].createAuthWit({ caller: accounts[1].address, action });

      await expect(action.simulate({ authWitnesses: [witness] })).rejects.toThrow('Assertion failed: Balance too low');
    });

    it('on behalf of other (invalid designated caller)', async () => {
      const balancePriv0 = await asset.methods.balance_of_private(accounts[0].address).simulate();
      const amount = balancePriv0 + 2n;
      const authwitNonce = Fr.random();
      expect(amount).toBeGreaterThan(0n);

      // We need to compute the message we want to sign and add it to the wallet as approved
      const action = asset
        .withWallet(wallets[2])
        .methods.transfer_to_public(accounts[0].address, accounts[1].address, amount, authwitNonce);
      const expectedMessageHash = await computeAuthWitMessageHash(
        { caller: accounts[2].address, action },
        { chainId: wallets[0].getChainId(), version: wallets[0].getVersion() },
      );

      // Both wallets are connected to same node and PXE so we could just insert directly
      // But doing it in two actions to show the flow.
      const witness = await wallets[0].createAuthWit({ caller: accounts[1].address, action });

      await expect(action.simulate({ authWitnesses: [witness] })).rejects.toThrow(
        `Unknown auth witness for message hash ${expectedMessageHash.toString()}`,
      );
    });
  });
});
