import type { Fr } from '@aztec/foundation/fields';

import { z } from 'zod';

import type { AztecAddress } from '../../aztec-address/index.js';
import { type ZodFor, schemas } from '../../schemas/index.js';

/**
 * An update to a contract instance, changing its contract class.
 */
export interface ContractInstanceUpdate {
  /** Identifier of the previous contract class for this instance */
  prevContractClassId: Fr;
  /** Identifier of the new contract class for this instance. */
  newContractClassId: Fr;
  /** The block number where the contract class in use will be the new one */
  blockOfChange: number;
}

export type ContractInstanceUpdateWithAddress = ContractInstanceUpdate & { address: AztecAddress };

export const ContractInstanceUpdateSchema = z.object({
  prevContractClassId: schemas.Fr,
  newContractClassId: schemas.Fr,
  blockOfChange: z.number().int().nonnegative(),
}) satisfies ZodFor<ContractInstanceUpdate>;

export const ContractInstanceUpdateWithAddressSchema = ContractInstanceUpdateSchema.and(
  z.object({ address: schemas.AztecAddress }),
) satisfies ZodFor<ContractInstanceUpdateWithAddress>;
