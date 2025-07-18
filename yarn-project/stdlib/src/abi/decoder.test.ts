import { Fr } from '@aztec/foundation/fields';

import { AztecAddress } from '../aztec-address/index.js';
import type { ABIParameterVisibility, FunctionArtifact } from './abi.js';
import { decodeFromAbi, decodeFunctionSignature, decodeFunctionSignatureWithParameterNames } from './decoder.js';

describe('abi/decoder', () => {
  // Copied from noir-contracts/contracts/test_contract/target/Test.json
  const abi = {
    name: 'testCodeGen',
    parameters: [
      { name: 'aField', type: { kind: 'field' }, visibility: 'private' },
      { name: 'aBool', type: { kind: 'boolean' }, visibility: 'private' },
      { name: 'aNumber', type: { kind: 'integer', sign: 'unsigned', width: 32 }, visibility: 'private' },
      { name: 'anArray', type: { kind: 'array', length: 2, type: { kind: 'field' } }, visibility: 'private' },
      {
        name: 'aStruct',
        type: {
          kind: 'struct',
          path: 'Test::DummyNote',
          fields: [
            { name: 'amount', type: { kind: 'field' } },
            { name: 'secretHash', type: { kind: 'field' } },
          ],
        },
        visibility: 'private' as ABIParameterVisibility,
      },
      {
        name: 'aDeepStruct',
        type: {
          kind: 'struct',
          path: 'Test::DeepStruct',
          fields: [
            { name: 'aField', type: { kind: 'field' } },
            { name: 'aBool', type: { kind: 'boolean' } },
            {
              name: 'aNote',
              type: {
                kind: 'struct',
                path: 'Test::DummyNote',
                fields: [
                  { name: 'amount', type: { kind: 'field' } },
                  { name: 'secretHash', type: { kind: 'field' } },
                ],
              },
            },
            {
              name: 'manyNotes',
              type: {
                kind: 'array',
                length: 3,
                type: {
                  kind: 'struct',
                  path: 'Test::DummyNote',
                  fields: [
                    { name: 'amount', type: { kind: 'field' } },
                    { name: 'secretHash', type: { kind: 'field' } },
                  ],
                },
              },
            },
          ],
        },
        visibility: 'private' as ABIParameterVisibility,
      },
    ],
  } as Pick<FunctionArtifact, 'name' | 'parameters'>;

  it('decodes function signature', () => {
    expect(decodeFunctionSignature(abi.name, abi.parameters)).toMatchInlineSnapshot(
      `"testCodeGen(Field,bool,u32,[Field;2],(Field,Field),(Field,bool,(Field,Field),[(Field,Field);3]))"`,
    );
  });

  it('decodes function signature with parameter names', () => {
    expect(decodeFunctionSignatureWithParameterNames(abi.name, abi.parameters)).toMatchInlineSnapshot(
      `"testCodeGen(aField: Field, aBool: bool, aNumber: u32, anArray: [Field;2], aStruct: (amount: Field, secretHash: Field), aDeepStruct: (aField: Field, aBool: bool, aNote: (amount: Field, secretHash: Field), manyNotes: [(amount: Field, secretHash: Field);3]))"`,
    );
  });
});

describe('decoder', () => {
  it('decodes an i8', () => {
    let decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 8,
        },
      ],
      [Fr.fromBuffer(Buffer.from('00000000000000000000000000000000000000000000000000000000000000ff', 'hex'))],
    );
    expect(decoded).toBe(-1n);

    decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 8,
        },
      ],
      [Fr.fromBuffer(Buffer.from('000000000000000000000000000000000000000000000000000000000000007f', 'hex'))],
    );
    expect(decoded).toBe(2n ** 7n - 1n);
  });

  it('decodes an i16', () => {
    let decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 16,
        },
      ],
      [Fr.fromBuffer(Buffer.from('000000000000000000000000000000000000000000000000000000000000ffff', 'hex'))],
    );
    expect(decoded).toBe(-1n);

    decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 16,
        },
      ],
      [Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000007fff', 'hex'))],
    );
    expect(decoded).toBe(2n ** 15n - 1n);
  });

  it('decodes an i32', () => {
    let decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 32,
        },
      ],
      [Fr.fromBuffer(Buffer.from('00000000000000000000000000000000000000000000000000000000ffffffff', 'hex'))],
    );
    expect(decoded).toBe(-1n);

    decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 32,
        },
      ],
      [Fr.fromBuffer(Buffer.from('000000000000000000000000000000000000000000000000000000007fffffff', 'hex'))],
    );
    expect(decoded).toBe(2n ** 31n - 1n);
  });

  it('decodes an i64', () => {
    let decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 64,
        },
      ],
      [Fr.fromBuffer(Buffer.from('000000000000000000000000000000000000000000000000ffffffffffffffff', 'hex'))],
    );
    expect(decoded).toBe(-1n);

    decoded = decodeFromAbi(
      [
        {
          kind: 'integer',
          sign: 'signed',
          width: 64,
        },
      ],
      [Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000007fffffffffffffff', 'hex'))],
    );
    expect(decoded).toBe(2n ** 63n - 1n);
  });

  it('decodes a tuple', () => {
    // ABI copied from noir-projects/noir-contracts/target/returning_tuple_contract-ReturningTuple.json
    const decoded = decodeFromAbi(
      [
        {
          kind: 'tuple',
          fields: [
            {
              kind: 'field',
            },
            {
              kind: 'integer',
              sign: 'unsigned',
              width: 128,
            },
            {
              kind: 'boolean',
            },
            {
              kind: 'string',
              length: 3,
            },
            {
              kind: 'struct',
              path: 'aztec::protocol_types::address::aztec_address::AztecAddress',
              fields: [
                {
                  name: 'inner',
                  type: {
                    kind: 'field',
                  },
                },
              ],
            },
            {
              kind: 'struct',
              path: 'std::embedded_curve_ops::EmbeddedCurvePoint',
              fields: [
                {
                  name: 'x',
                  type: {
                    kind: 'field',
                  },
                },
                {
                  name: 'y',
                  type: {
                    kind: 'field',
                  },
                },
                {
                  name: 'is_infinite',
                  type: {
                    kind: 'boolean',
                  },
                },
              ],
            },
          ],
        },
      ],
      [
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')), // field
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex')), // u128
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')), // bool
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000078', 'hex')), // "x"
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000079', 'hex')), // "y"
        Fr.fromBuffer(Buffer.from('000000000000000000000000000000000000000000000000000000000000007a', 'hex')), // "z"
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')), // address
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')), // point.x
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex')), // point.y
        Fr.fromBuffer(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')), // point.is_infinite
      ],
    );

    expect(decoded).toEqual([
      1n,
      2n,
      false,
      'xyz',
      AztecAddress.fromBigInt(1n),
      // eslint-disable-next-line camelcase
      { x: 1n, y: 2n, is_infinite: false },
    ]);
  });
});
