import { toBigIntBE, toHex } from '@aztec/foundation/bigint-buffer';
import { keccak256 } from '@aztec/foundation/crypto';
import { type EthAddress } from '@aztec/foundation/eth-address';
import { createLogger } from '@aztec/foundation/log';

import fs from 'fs';
import { type Hex } from 'viem';

/**
 * A class that provides utility functions for interacting with ethereum (L1).
 */
export class EthCheatCodes {
  constructor(
    /**
     * The RPC URL to use for interacting with the chain
     */
    public rpcUrl: string,
    /**
     * The logger to use for the eth cheatcodes
     */
    public logger = createLogger('ethereum:cheat_codes'),
  ) {}

  async rpcCall(method: string, params: any[]) {
    const paramsString = JSON.stringify(params);
    const content = {
      body: `{"jsonrpc":"2.0", "method": "${method}", "params": ${paramsString}, "id": 1}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    return await (await fetch(this.rpcUrl, content)).json();
  }

  /**
   * Get the auto mine status of the underlying chain
   * @returns True if automine is on, false otherwise
   */
  public async isAutoMining(): Promise<boolean> {
    try {
      const res = await this.rpcCall('anvil_getAutomine', []);
      return res.result;
    } catch (err) {
      this.logger.error(`Calling "anvil_getAutomine" failed with:`, err);
    }
    return false;
  }

  /**
   * Get the current blocknumber
   * @returns The current block number
   */
  public async blockNumber(): Promise<number> {
    const res = await this.rpcCall('eth_blockNumber', []);
    return parseInt(res.result, 16);
  }

  /**
   * Get the current chainId
   * @returns The current chainId
   */
  public async chainId(): Promise<number> {
    const res = await this.rpcCall('eth_chainId', []);
    return parseInt(res.result, 16);
  }

  /**
   * Get the current timestamp
   * @returns The current timestamp
   */
  public async timestamp(): Promise<number> {
    const res = await this.rpcCall('eth_getBlockByNumber', ['latest', true]);
    return parseInt(res.result.timestamp, 16);
  }

  /**
   * Advance the chain by a number of blocks
   * @param numberOfBlocks - The number of blocks to mine
   */
  public async mine(numberOfBlocks = 1): Promise<void> {
    await this.doMine(numberOfBlocks);
    this.logger.verbose(`Mined ${numberOfBlocks} L1 blocks`);
  }

  private async doMine(numberOfBlocks = 1): Promise<void> {
    const res = await this.rpcCall('hardhat_mine', [numberOfBlocks]);
    if (res.error) {
      throw new Error(`Error mining: ${res.error.message}`);
    }
  }

  /**
   * Mines a single block with evm_mine
   */
  public async evmMine(): Promise<void> {
    const res = await this.rpcCall('evm_mine', []);
    if (res.error) {
      throw new Error(`Error mining: ${res.error.message}`);
    }
  }

  /**
   * Set the balance of an account
   * @param account - The account to set the balance for
   * @param balance - The balance to set
   */
  public async setBalance(account: EthAddress, balance: bigint): Promise<void> {
    const res = await this.rpcCall('anvil_setBalance', [account.toString(), toHex(balance)]);
    if (res.error) {
      throw new Error(`Error setting balance for ${account}: ${res.error.message}`);
    }
    this.logger.verbose(`Set balance for ${account} to ${balance}`);
  }

  /**
   * Set the interval between blocks (block time)
   * @param interval - The interval to use between blocks
   */
  public async setBlockInterval(interval: number): Promise<void> {
    const res = await this.rpcCall('anvil_setBlockTimestampInterval', [interval]);
    if (res.error) {
      throw new Error(`Error setting block interval: ${res.error.message}`);
    }
    this.logger.verbose(`Set L1 block interval to ${interval}`);
  }

  /**
   * Set the next block base fee per gas
   * @param baseFee - The base fee to set
   */
  public async setNextBlockBaseFeePerGas(baseFee: bigint): Promise<void> {
    const res = await this.rpcCall('anvil_setNextBlockBaseFeePerGas', [baseFee.toString()]);
    if (res.error) {
      throw new Error(`Error setting next block base fee per gas: ${res.error.message}`);
    }
    this.logger.verbose(`Set L1 next block base fee per gas to ${baseFee}`);
  }

  /**
   * Set the interval between blocks (block time)
   * @param seconds - The interval to use between blocks
   */
  public async setIntervalMining(seconds: number): Promise<void> {
    const res = await this.rpcCall('anvil_setIntervalMining', [seconds]);
    if (res.error) {
      throw new Error(`Error setting interval mining: ${res.error.message}`);
    }
    this.logger.verbose(`Set L1 interval mining to ${seconds} seconds`);
  }

  /**
   * Set the automine status of the underlying anvil chain
   * @param automine - The automine status to set
   */
  public async setAutomine(automine: boolean): Promise<void> {
    const res = await this.rpcCall('anvil_setAutomine', [automine]);
    if (res.error) {
      throw new Error(`Error setting automine: ${res.error.message}`);
    }
    this.logger.verbose(`Set L1 automine to ${automine}`);
  }

  /**
   * Drop a transaction from the mempool
   * @param txHash - The transaction hash
   */
  public async dropTransaction(txHash: Hex): Promise<void> {
    const res = await this.rpcCall('anvil_dropTransaction', [txHash]);
    if (res.error) {
      throw new Error(`Error dropping transaction: ${res.error.message}`);
    }
    this.logger.verbose(`Dropped transaction ${txHash}`);
  }

  /**
   * Set the next block timestamp
   * @param timestamp - The timestamp to set the next block to
   */
  public async setNextBlockTimestamp(timestamp: number): Promise<void> {
    const res = await this.rpcCall('evm_setNextBlockTimestamp', [timestamp]);
    if (res.error) {
      throw new Error(`Error setting next block timestamp: ${res.error.message}`);
    }
    this.logger.verbose(`Set L1 next block timestamp to ${timestamp}`);
  }

  /**
   * Set the next block timestamp and mines the block
   * @param timestamp - The timestamp to set the next block to
   */
  public async warp(timestamp: number | bigint): Promise<void> {
    const res = await this.rpcCall('evm_setNextBlockTimestamp', [Number(timestamp)]);
    if (res.error) {
      throw new Error(`Error warping: ${res.error.message}`);
    }
    await this.doMine();
    this.logger.verbose(`Warped L1 timestamp to ${timestamp}`);
  }

  /**
   * Dumps the current chain state to a file.
   * @param fileName - The file name to dump state into
   */
  public async dumpChainState(fileName: string): Promise<void> {
    const res = await this.rpcCall('hardhat_dumpState', []);
    if (res.error) {
      throw new Error(`Error dumping state: ${res.error.message}`);
    }
    const jsonContent = JSON.stringify(res.result);
    fs.writeFileSync(`${fileName}.json`, jsonContent, 'utf8');
    this.logger.verbose(`Dumped state to ${fileName}`);
  }

  /**
   * Loads the chain state from a file.
   * @param fileName - The file name to load state from
   */
  public async loadChainState(fileName: string): Promise<void> {
    const data = JSON.parse(fs.readFileSync(`${fileName}.json`, 'utf8'));
    const res = await this.rpcCall('hardhat_loadState', [data]);
    if (res.error) {
      throw new Error(`Error loading state: ${res.error.message}`);
    }
    this.logger.verbose(`Loaded state from ${fileName}`);
  }

  /**
   * Load the value at a storage slot of a contract address on eth
   * @param contract - The contract address
   * @param slot - The storage slot
   * @returns - The value at the storage slot
   */
  public async load(contract: EthAddress, slot: bigint): Promise<bigint> {
    const res = await this.rpcCall('eth_getStorageAt', [contract.toString(), toHex(slot), 'latest']);
    return BigInt(res.result);
  }

  /**
   * Set the value at a storage slot of a contract address on eth
   * @param contract - The contract address
   * @param slot - The storage slot
   * @param value - The value to set the storage slot to
   */
  public async store(contract: EthAddress, slot: bigint, value: bigint): Promise<void> {
    // for the rpc call, we need to change value to be a 32 byte hex string.
    const res = await this.rpcCall('hardhat_setStorageAt', [contract.toString(), toHex(slot), toHex(value, true)]);
    if (res.error) {
      throw new Error(`Error setting storage for contract ${contract} at ${slot}: ${res.error.message}`);
    }
    this.logger.verbose(`Set L1 storage for contract ${contract} at ${slot} to ${value}`);
  }

  /**
   * Computes the slot value for a given map and key.
   * @param baseSlot - The base slot of the map (specified in Aztec.nr contract)
   * @param key - The key to lookup in the map
   * @returns The storage slot of the value in the map
   */
  public keccak256(baseSlot: bigint, key: bigint): bigint {
    // abi encode (removing the 0x) - concat key and baseSlot (both padded to 32 bytes)
    const abiEncoded = toHex(key, true).substring(2) + toHex(baseSlot, true).substring(2);
    return toBigIntBE(keccak256(Buffer.from(abiEncoded, 'hex')));
  }

  /**
   * Send transactions impersonating an externally owned account or contract.
   * @param who - The address to impersonate
   */
  public async startImpersonating(who: EthAddress | Hex): Promise<void> {
    const res = await this.rpcCall('hardhat_impersonateAccount', [who.toString()]);
    if (res.error) {
      throw new Error(`Error impersonating ${who}: ${res.error.message}`);
    }
    this.logger.verbose(`Impersonating ${who}`);
  }

  /**
   * Stop impersonating an account that you are currently impersonating.
   * @param who - The address to stop impersonating
   */
  public async stopImpersonating(who: EthAddress | Hex): Promise<void> {
    const res = await this.rpcCall('hardhat_stopImpersonatingAccount', [who.toString()]);
    if (res.error) {
      throw new Error(`Error when stopping the impersonation of ${who}: ${res.error.message}`);
    }
    this.logger.verbose(`Stopped impersonating ${who}`);
  }

  /**
   * Set the bytecode for a contract
   * @param contract - The contract address
   * @param bytecode - The bytecode to set
   */
  public async etch(contract: EthAddress, bytecode: `0x${string}`): Promise<void> {
    const res = await this.rpcCall('hardhat_setCode', [contract.toString(), bytecode]);
    if (res.error) {
      throw new Error(`Error setting bytecode for ${contract}: ${res.error.message}`);
    }
    this.logger.verbose(`Set bytecode for ${contract} to ${bytecode}`);
  }

  /**
   * Get the bytecode for a contract
   * @param contract - The contract address
   * @returns The bytecode for the contract
   */
  public async getBytecode(contract: EthAddress): Promise<`0x${string}`> {
    const res = await this.rpcCall('eth_getCode', [contract.toString(), 'latest']);
    return res.result;
  }

  /**
   * Get the raw transaction object for a given transaction hash
   * @param txHash - The transaction hash
   * @returns The raw transaction
   */
  public async getRawTransaction(txHash: Hex): Promise<`0x${string}`> {
    const res = await this.rpcCall('debug_getRawTransaction', [txHash]);
    return res.result;
  }
}
