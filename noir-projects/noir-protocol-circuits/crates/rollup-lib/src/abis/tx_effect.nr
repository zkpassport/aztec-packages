use types::{
    abis::{
        contract_class_log::ContractClassLog, private_log::PrivateLog,
        public_data_write::PublicDataWrite, public_log::PublicLog,
    },
    constants::{
        MAX_CONTRACT_CLASS_LOGS_PER_TX, MAX_L2_TO_L1_MSGS_PER_TX, MAX_NOTE_HASHES_PER_TX,
        MAX_NULLIFIERS_PER_TX, MAX_PRIVATE_LOGS_PER_TX, MAX_PUBLIC_LOGS_PER_TX,
        MAX_TOTAL_PUBLIC_DATA_UPDATE_REQUESTS_PER_TX,
    },
    traits::Empty,
};

#[derive(Eq)]
pub(crate) struct TxEffect {
    pub(crate) tx_hash: Field,
    pub(crate) revert_code: u8,
    pub(crate) transaction_fee: Field,
    pub(crate) note_hashes: [Field; MAX_NOTE_HASHES_PER_TX],
    pub(crate) nullifiers: [Field; MAX_NULLIFIERS_PER_TX],
    pub(crate) l2_to_l1_msgs: [Field; MAX_L2_TO_L1_MSGS_PER_TX],
    pub(crate) public_data_writes: [PublicDataWrite; MAX_TOTAL_PUBLIC_DATA_UPDATE_REQUESTS_PER_TX],
    pub(crate) private_logs: [PrivateLog; MAX_PRIVATE_LOGS_PER_TX],
    pub(crate) public_logs: [PublicLog; MAX_PUBLIC_LOGS_PER_TX],
    pub(crate) contract_class_logs: [ContractClassLog; MAX_CONTRACT_CLASS_LOGS_PER_TX],
}

impl Empty for TxEffect {
    fn empty() -> Self {
        TxEffect {
            tx_hash: 0,
            revert_code: 0,
            transaction_fee: 0,
            note_hashes: [0; MAX_NOTE_HASHES_PER_TX],
            nullifiers: [0; MAX_NULLIFIERS_PER_TX],
            l2_to_l1_msgs: [0; MAX_L2_TO_L1_MSGS_PER_TX],
            public_data_writes: [
                PublicDataWrite::empty(); MAX_TOTAL_PUBLIC_DATA_UPDATE_REQUESTS_PER_TX
            ],
            private_logs: [PrivateLog::empty(); MAX_PRIVATE_LOGS_PER_TX],
            public_logs: [PublicLog::empty(); MAX_PUBLIC_LOGS_PER_TX],
            contract_class_logs: [ContractClassLog::empty(); MAX_CONTRACT_CLASS_LOGS_PER_TX],
        }
    }
}
