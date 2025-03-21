import { AztecNodeService } from '@aztec/aztec-node';
import { AztecAddress, Fr } from '@aztec/aztec.js';
import { BENCHMARK_BLOCK_SIZES } from '@aztec/circuit-types/stats';
import { type BenchmarkingContract } from '@aztec/noir-contracts.js/Benchmarking';
import { type SequencerClient } from '@aztec/sequencer-client';

import { type EndToEndContext } from '../fixtures/utils.js';
import { benchmarkSetup, createNewPXE, sendTxs } from './utils.js';

describe('benchmarks/publish_rollup', () => {
  let context: EndToEndContext;
  let contract: BenchmarkingContract;
  let sequencer: SequencerClient;

  beforeEach(async () => {
    ({ context, contract, sequencer } = await benchmarkSetup({ maxTxsPerBlock: 1024 }));
  });

  it.each(BENCHMARK_BLOCK_SIZES)(
    `publishes a rollup with %d txs`,
    async (txCount: number) => {
      await sequencer.stop();

      // Simulate and simultaneously send ROLLUP_SIZE txs. These should not yet be processed since sequencer is stopped.
      context.logger.info(`Assembling rollup with ${txCount} txs`);
      const sentTxs = await sendTxs(txCount, context, contract);
      context.logger.info(`Sent ${txCount} txs`);
      // Restart sequencer to process all txs together
      sequencer.restart();

      // Wait for the last tx to be processed and stop the current node
      const { blockNumber } = await sentTxs[sentTxs.length - 1].wait({ timeout: 5 * 60_000 });
      await context.teardown();

      // Create a new aztec node to measure sync time of the block
      // and call getPublicStorageAt (which calls #getWorldState, which calls #syncWorldState) to force a sync with
      // world state to ensure the node has caught up
      context.logger.info(`Starting new aztec node`);
      const node = await AztecNodeService.createAndSync({ ...context.config, disableValidator: true });
      await node.getPublicStorageAt(AztecAddress.random(), Fr.random(), 'latest');

      // Spin up a new pxe and sync it, we'll use it to test sync times of new accounts for the last block
      context.logger.info(`Starting new pxe`);
      const pxe = await createNewPXE(node, contract, blockNumber! - 1);

      // Register the owner account and wait until it's synced so we measure how much time it took
      context.logger.info(`Registering owner account on new pxe`);
      const partialAddress = context.wallet.getCompleteAddress().partialAddress;
      const secretKey = context.wallet.getSecretKey();
      await pxe.registerAccount(secretKey, partialAddress);

      // Repeat for another account that didn't receive any notes for them, so we measure trial-decrypts
      context.logger.info(`Registering fresh account on new pxe`);
      await pxe.registerAccount(Fr.random(), Fr.random());

      // Stop the external node
      await node.stop();
    },
    20 * 60_000,
  );
});
