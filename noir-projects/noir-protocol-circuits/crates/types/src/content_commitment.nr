use crate::{constants::CONTENT_COMMITMENT_LENGTH, traits::{Deserialize, Empty, Serialize}};

pub struct ContentCommitment {
    pub blobs_hash: Field,
    pub in_hash: Field,
    pub out_hash: Field,
}

impl Serialize<CONTENT_COMMITMENT_LENGTH> for ContentCommitment {
    fn serialize(self) -> [Field; CONTENT_COMMITMENT_LENGTH] {
        let mut fields: BoundedVec<Field, CONTENT_COMMITMENT_LENGTH> = BoundedVec::new();

        fields.push(self.blobs_hash);
        fields.push(self.in_hash);
        fields.push(self.out_hash);

        fields.storage()
    }
}

impl Deserialize<CONTENT_COMMITMENT_LENGTH> for ContentCommitment {
    fn deserialize(serialized: [Field; CONTENT_COMMITMENT_LENGTH]) -> Self {
        let blobs_hash = serialized[0];
        let in_hash = serialized[1];
        let out_hash = serialized[2];
        Self { blobs_hash, in_hash, out_hash }
    }
}

impl Empty for ContentCommitment {
    fn empty() -> Self {
        Self { blobs_hash: 0, in_hash: 0, out_hash: 0 }
    }
}

impl Eq for ContentCommitment {
    fn eq(self, other: Self) -> bool {
        (self.blobs_hash == other.blobs_hash)
            & (self.in_hash == other.in_hash)
            & (self.out_hash == other.out_hash)
    }
}

#[test]
fn serialization_of_empty() {
    let empty = ContentCommitment::empty();
    let serialized = empty.serialize();
    let deserialized = ContentCommitment::deserialize(serialized);

    assert(empty.eq(deserialized));
}
