use crate::{
    abis::gas_fees::GasFees,
    address::{AztecAddress, EthAddress},
    constants::{PROPOSED_BLOCK_HEADER_LENGTH, PROPOSED_BLOCK_HEADER_LENGTH_BYTES},
    content_commitment::ContentCommitment,
    hash::sha256_to_field,
    traits::{Deserialize, Empty, FromField, Hash, Serialize, ToField},
    utils::reader::Reader,
};

pub struct ProposedBlockHeader {
    pub last_archive_root: Field,
    pub content_commitment: ContentCommitment,

    // Partial global_variables:
    pub slot_number: Field,
    pub timestamp: u64,
    pub coinbase: EthAddress,
    pub fee_recipient: AztecAddress,
    pub gas_fees: GasFees,

    pub total_mana_used: Field,
}

impl Eq for ProposedBlockHeader {
    fn eq(self, other: Self) -> bool {
        (self.last_archive_root == other.last_archive_root)
            & (self.content_commitment == other.content_commitment)
            & (self.slot_number == other.slot_number)
            & (self.timestamp == other.timestamp)
            & (self.coinbase == other.coinbase)
            & (self.fee_recipient == other.fee_recipient)
            & (self.gas_fees == other.gas_fees)
            & (self.total_mana_used == other.total_mana_used)
    }
}

impl Serialize<PROPOSED_BLOCK_HEADER_LENGTH> for ProposedBlockHeader {
    fn serialize(self) -> [Field; PROPOSED_BLOCK_HEADER_LENGTH] {
        let mut serialized: BoundedVec<Field, PROPOSED_BLOCK_HEADER_LENGTH> = BoundedVec::new();

        serialized.push(self.last_archive_root);
        serialized.extend_from_array(self.content_commitment.serialize());
        serialized.push(self.slot_number);
        serialized.push(self.timestamp as Field);
        serialized.push(self.coinbase.to_field());
        serialized.push(self.fee_recipient.to_field());
        serialized.extend_from_array(self.gas_fees.serialize());
        serialized.push(self.total_mana_used);

        serialized.storage()
    }
}

impl Deserialize<PROPOSED_BLOCK_HEADER_LENGTH> for ProposedBlockHeader {
    fn deserialize(serialized: [Field; PROPOSED_BLOCK_HEADER_LENGTH]) -> Self {
        let mut reader = Reader::new(serialized);

        ProposedBlockHeader {
            last_archive_root: reader.read(),
            content_commitment: reader.read_struct(ContentCommitment::deserialize),
            slot_number: reader.read(),
            timestamp: reader.read() as u64,
            coinbase: EthAddress::from_field(reader.read()),
            fee_recipient: AztecAddress::from_field(reader.read()),
            gas_fees: reader.read_struct(GasFees::deserialize),
            total_mana_used: reader.read(),
        }
    }
}

impl Empty for ProposedBlockHeader {
    fn empty() -> Self {
        Self {
            last_archive_root: 0,
            content_commitment: ContentCommitment::empty(),
            slot_number: 0,
            timestamp: 0,
            coinbase: EthAddress::zero(),
            fee_recipient: AztecAddress::zero(),
            gas_fees: GasFees::empty(),
            total_mana_used: 0,
        }
    }
}

impl ProposedBlockHeader {
    pub fn to_be_bytes(self) -> [u8; PROPOSED_BLOCK_HEADER_LENGTH_BYTES] {
        let mut bytes = [0; PROPOSED_BLOCK_HEADER_LENGTH_BYTES];

        let last_archive_root_bytes: [u8; 32] = self.last_archive_root.to_be_bytes();
        let blobs_hash_bytes: [u8; 32] = self.content_commitment.blobs_hash.to_be_bytes();
        let in_hash_bytes: [u8; 32] = self.content_commitment.in_hash.to_be_bytes();
        let out_hash_bytes: [u8; 32] = self.content_commitment.out_hash.to_be_bytes();
        let slot_number_bytes: [u8; 32] = self.slot_number.to_be_bytes();
        let coinbase_bytes: [u8; 20] = self.coinbase.to_be_bytes();
        let fee_recipient_bytes: [u8; 32] = self.fee_recipient.to_field().to_be_bytes();
        let gas_fees_per_da_gas_bytes: [u8; 16] =
            (self.gas_fees.fee_per_da_gas as Field).to_be_bytes();
        let gas_fees_per_l2_gas_bytes: [u8; 16] =
            (self.gas_fees.fee_per_l2_gas as Field).to_be_bytes();
        let total_mana_used_bytes: [u8; 32] = self.total_mana_used.to_be_bytes();

        for i in 0..32 {
            bytes[i] = last_archive_root_bytes[i];
            bytes[i + 32] = blobs_hash_bytes[i];
            bytes[i + 64] = in_hash_bytes[i];
            bytes[i + 96] = out_hash_bytes[i];
            bytes[i + 128] = slot_number_bytes[i];
        }

        let mut timestamp = self.timestamp;
        for i in 0..8 {
            bytes[168 - 1 - i] = timestamp as u8;
            timestamp = timestamp >> 8;
        }

        for i in 0..20 {
            bytes[i + 168] = coinbase_bytes[i];
        }

        for i in 0..32 {
            bytes[i + 188] = fee_recipient_bytes[i];
        }

        for i in 0..16 {
            bytes[i + 220] = gas_fees_per_da_gas_bytes[i];
            bytes[i + 236] = gas_fees_per_l2_gas_bytes[i];
        }

        for i in 0..32 {
            bytes[i + 252] = total_mana_used_bytes[i];
        }

        bytes
    }
}

impl Hash for ProposedBlockHeader {
    fn hash(self) -> Field {
        sha256_to_field(self.to_be_bytes())
    }
}

#[test]
fn serialization_of_empty() {
    let header = ProposedBlockHeader::empty();
    let serialized = header.serialize();
    let deserialized = ProposedBlockHeader::deserialize(serialized);
    assert(header.eq(deserialized));
}

#[test]
fn hash_of_empty_proposed_block_header_match_typescript() {
    let header = ProposedBlockHeader::empty();
    let hash = header.hash();

    // Value from proposed_block_header.test.ts "computes empty hash" test
    let test_data_empty_hash = 0x00d72511e843bf5a2e44e8bd1da20c2626311d1d6679424f717807a1db731d62;
    assert_eq(hash, test_data_empty_hash);
}
