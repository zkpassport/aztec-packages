use dep::mock_types::{
    AppPublicInputs, CLIENT_IVC_VERIFICATION_KEY_LENGTH_IN_FIELDS, PrivateKernelPublicInputs,
    PrivateKernelPublicInputsBuilder, PROOF_TYPE_OINK, TxRequest, VerificationKey,
};

fn main(
    tx: TxRequest,
    app_inputs: call_data(1) AppPublicInputs,
    app_vk: VerificationKey<CLIENT_IVC_VERIFICATION_KEY_LENGTH_IN_FIELDS>,
) -> return_data PrivateKernelPublicInputs {
    std::verify_proof_with_type(app_vk.key, [], [], app_vk.hash, PROOF_TYPE_OINK);

    let mut private_kernel_inputs = PrivateKernelPublicInputsBuilder::from_tx(tx);
    private_kernel_inputs.ingest_app_inputs(app_inputs);
    private_kernel_inputs.finish()
}
