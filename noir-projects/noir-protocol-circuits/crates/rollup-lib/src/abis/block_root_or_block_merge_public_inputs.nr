use dep::types::{
    abis::{
        append_only_tree_snapshot::AppendOnlyTreeSnapshot, epoch_constant_data::EpochConstantData,
        global_variables::GlobalVariables,
    },
    address::EthAddress,
    constants::{
        AZTEC_MAX_EPOCH_DURATION, BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH,
        FEE_RECIPIENT_LENGTH,
    },
    traits::{Deserialize, Empty, Serialize, ToField},
    utils::reader::Reader,
};
use blob::blob_batching_public_inputs::BlockBlobPublicInputs;

pub struct FeeRecipient {
    pub recipient: EthAddress,
    pub value: Field,
}

// TODO(#7346): Should the default empty value be MAX_FIELD? The zero addr may be a valid recipient
impl Empty for FeeRecipient {
    fn empty() -> Self {
        Self { recipient: EthAddress::zero(), value: 0 }
    }
}

impl Serialize<FEE_RECIPIENT_LENGTH> for FeeRecipient {
    fn serialize(self) -> [Field; FEE_RECIPIENT_LENGTH] {
        [self.recipient.to_field(), self.value]
    }
}

impl Deserialize<FEE_RECIPIENT_LENGTH> for FeeRecipient {
    fn deserialize(values: [Field; FEE_RECIPIENT_LENGTH]) -> Self {
        Self { recipient: EthAddress::from_field(values[0]), value: values[1] }
    }
}

impl Eq for FeeRecipient {
    fn eq(self, other: Self) -> bool {
        (self.recipient.eq(other.recipient)) & (self.value == other.value)
    }
}

pub struct BlockRootOrBlockMergePublicInputs {
    pub constants: EpochConstantData,
    pub previous_archive: AppendOnlyTreeSnapshot, // Archive tree root immediately before this block range
    pub new_archive: AppendOnlyTreeSnapshot, // Archive tree root after adding this block range
    pub start_global_variables: GlobalVariables, // Global variables for the first block in the range
    pub end_global_variables: GlobalVariables, // Global variables for the last block in the range
    pub out_hash: Field, // Merkle node of the L2-to-L1 messages merkle roots in the block range
    pub proposed_block_header_hashes: [Field; AZTEC_MAX_EPOCH_DURATION], // Hashes of proposed block headers for the block range
    pub fees: [FeeRecipient; AZTEC_MAX_EPOCH_DURATION], // Concatenation of all coinbase and fees for the block range
    pub blob_public_inputs: BlockBlobPublicInputs, // Blob accumulators at the start and end of this block range
}

impl BlockRootOrBlockMergePublicInputs {
    pub fn num_blocks(self) -> u32 {
        self.end_global_variables.block_number - self.start_global_variables.block_number + 1
    }
}

impl Empty for BlockRootOrBlockMergePublicInputs {
    fn empty() -> Self {
        BlockRootOrBlockMergePublicInputs {
            constants: EpochConstantData::empty(),
            previous_archive: AppendOnlyTreeSnapshot::empty(),
            new_archive: AppendOnlyTreeSnapshot::empty(),
            start_global_variables: GlobalVariables::empty(),
            end_global_variables: GlobalVariables::empty(),
            out_hash: 0,
            proposed_block_header_hashes: [0; AZTEC_MAX_EPOCH_DURATION],
            fees: [FeeRecipient::empty(); AZTEC_MAX_EPOCH_DURATION],
            blob_public_inputs: BlockBlobPublicInputs::empty(),
        }
    }
}

impl Eq for BlockRootOrBlockMergePublicInputs {
    fn eq(self, other: Self) -> bool {
        (self.constants.eq(other.constants))
            & self.previous_archive.eq(other.previous_archive)
            & self.new_archive.eq(other.new_archive)
            & self.start_global_variables.eq(other.start_global_variables)
            & self.end_global_variables.eq(other.end_global_variables)
            & self.out_hash.eq(other.out_hash)
            & self.proposed_block_header_hashes.eq(other.proposed_block_header_hashes)
            & self.fees.eq(other.fees)
            & self.blob_public_inputs.eq(other.blob_public_inputs)
    }
}

impl Serialize<BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH> for BlockRootOrBlockMergePublicInputs {
    fn serialize(self) -> [Field; BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH] {
        let mut fields: BoundedVec<Field, BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH> =
            BoundedVec::new();

        fields.extend_from_array(self.constants.serialize());
        fields.extend_from_array(self.previous_archive.serialize());
        fields.extend_from_array(self.new_archive.serialize());
        fields.extend_from_array(self.start_global_variables.serialize());
        fields.extend_from_array(self.end_global_variables.serialize());
        fields.push(self.out_hash as Field);
        fields.extend_from_array(self.proposed_block_header_hashes);
        for i in 0..AZTEC_MAX_EPOCH_DURATION {
            fields.extend_from_array(self.fees[i].serialize());
        }
        fields.extend_from_array(self.blob_public_inputs.serialize());
        assert_eq(fields.len(), BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH);

        fields.storage()
    }
}

impl Deserialize<BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH> for BlockRootOrBlockMergePublicInputs {
    fn deserialize(
        fields: [Field; BLOCK_ROOT_OR_BLOCK_MERGE_PUBLIC_INPUTS_LENGTH],
    ) -> BlockRootOrBlockMergePublicInputs {
        let mut reader = Reader::new(fields);
        let item = Self {
            constants: reader.read_struct(EpochConstantData::deserialize),
            previous_archive: reader.read_struct(AppendOnlyTreeSnapshot::deserialize),
            new_archive: reader.read_struct(AppendOnlyTreeSnapshot::deserialize),
            start_global_variables: reader.read_struct(GlobalVariables::deserialize),
            end_global_variables: reader.read_struct(GlobalVariables::deserialize),
            out_hash: reader.read(),
            proposed_block_header_hashes: reader.read_array(),
            fees: reader.read_struct_array(
                FeeRecipient::deserialize,
                [FeeRecipient::empty(); AZTEC_MAX_EPOCH_DURATION],
            ),
            blob_public_inputs: reader.read_struct(BlockBlobPublicInputs::deserialize),
        };

        reader.finish();
        item
    }
}

#[test]
fn serialization_of_empty() {
    let item = BlockRootOrBlockMergePublicInputs::empty();
    let serialized = item.serialize();
    let deserialized = BlockRootOrBlockMergePublicInputs::deserialize(serialized);
    assert(item.eq(deserialized));
}
