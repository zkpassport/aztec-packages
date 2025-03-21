use dep::aztec::protocol_types::{
    abis::function_selector::FunctionSelector, address::AztecAddress, traits::Serialize,
};

// 1 (ARGS_HASH) + 1 (FUNCTION_SELECTOR) + 1 (TARGET_ADDRESS) + 1 (IS_PUBLIC) + 1 (IS_STATIC)
global FUNCTION_CALL_SIZE: u32 = 5;
// 3 * 32 + 2
global FUNCTION_CALL_SIZE_IN_BYTES: u32 = 98;

pub struct FunctionCall {
    pub args_hash: Field,
    pub function_selector: FunctionSelector,
    pub target_address: AztecAddress,
    pub is_public: bool,
    pub is_static: bool,
}

impl Serialize<FUNCTION_CALL_SIZE> for FunctionCall {
    fn serialize(self) -> [Field; FUNCTION_CALL_SIZE] {
        [
            self.args_hash,
            self.function_selector.to_field(),
            self.target_address.to_field(),
            self.is_public as Field,
            self.is_static as Field,
        ]
    }
}

impl FunctionCall {
    fn to_be_bytes(self) -> [u8; FUNCTION_CALL_SIZE_IN_BYTES] {
        let mut bytes: [u8; FUNCTION_CALL_SIZE_IN_BYTES] = [0; FUNCTION_CALL_SIZE_IN_BYTES];
        let args_hash_bytes: [u8; 32] = self.args_hash.to_be_bytes();
        for i in 0..32 {
            bytes[i] = args_hash_bytes[i];
        }
        let function_selector_bytes: [u8; 32] = self.function_selector.to_field().to_be_bytes();
        for i in 0..32 {
            bytes[i + 32] = function_selector_bytes[i];
        }
        let target_address_bytes: [u8; 32] = self.target_address.to_field().to_be_bytes();
        for i in 0..32 {
            bytes[i + 64] = target_address_bytes[i];
        }
        bytes[96] = self.is_public as u8;
        bytes[97] = self.is_static as u8;
        bytes
    }
}
