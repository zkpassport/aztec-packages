use dep::aztec::macros::aztec;

#[aztec]
contract Updated {
    use aztec::macros::{functions::{private, public, utility}, storage::storage};
    use aztec::messages::logs::note::encode_and_encrypt_note;
    use aztec::state_vars::{PrivateMutable, PublicMutable};

    use aztec::protocol_types::constants::DEPLOYER_CONTRACT_ADDRESS;
    use contract_instance_deployer::ContractInstanceDeployer;
    use value_note::value_note::ValueNote;

    #[storage]
    struct Storage<Context> {
        private_value: PrivateMutable<ValueNote, Context>,
        public_value: PublicMutable<Field, Context>,
    }

    #[public]
    fn set_public_value() {
        storage.public_value.write(27);
    }

    #[private]
    fn set_private_value() {
        let owner = context.msg_sender();
        let new_note = ValueNote::new(27, owner);
        storage.private_value.replace(new_note).emit(encode_and_encrypt_note(
            &mut context,
            owner,
            owner,
        ));
    }

    #[public]
    fn get_update_delay() -> u64 {
        ContractInstanceDeployer::at(DEPLOYER_CONTRACT_ADDRESS).get_update_delay().view(&mut context)
    }

    #[utility]
    unconstrained fn get_private_value() -> Field {
        storage.private_value.view_note().value
    }

    #[utility]
    unconstrained fn get_public_value() -> Field {
        storage.public_value.read()
    }

}
