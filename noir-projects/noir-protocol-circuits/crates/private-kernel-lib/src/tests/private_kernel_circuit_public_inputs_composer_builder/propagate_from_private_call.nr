use crate::{
    components::private_kernel_circuit_public_inputs_composer::create_protocol_nullifier,
    tests::private_kernel_circuit_public_inputs_composer_builder::PrivateKernelCircuitPublicInputsComposerBuilder,
};
use dep::types::{constants::DEFAULT_UPDATE_DELAY, tests::utils::assert_array_eq, traits::Empty};

#[test]
fn propagate_from_private_call_empty_data_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();
    builder.with_protocol_nullifier();

    let tx_request = builder.tx_request;
    let protocol_nullifier = create_protocol_nullifier(tx_request);

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_eq(output.end.nullifiers.array[0], protocol_nullifier);

    assert_eq(output.min_revertible_side_effect_counter, 0);
    assert(output.validation_requests.note_hash_read_requests.is_empty());
    assert(output.validation_requests.nullifier_read_requests.is_empty());
    assert(output.validation_requests.scoped_key_validation_requests_and_generators.is_empty());
    assert(output.validation_requests.split_counter.is_empty());
    assert_eq(
        output.validation_requests.for_rollup.include_by_timestamp.unwrap_unchecked(),
        DEFAULT_UPDATE_DELAY,
    );
    assert(output.public_teardown_call_request.is_empty());
    assert(output.fee_payer.is_empty());
}

#[test]
fn propagate_from_private_call_min_revertible_side_effect_counter_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.min_revertible_side_effect_counter = 123;

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_eq(output.min_revertible_side_effect_counter, 123);
}

#[test]
fn propagate_from_private_call_include_by_timestamp_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.set_include_by_timestamp(5);

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_eq(output.validation_requests.for_rollup.include_by_timestamp.unwrap(), 5);
}

#[test]
fn propagate_from_private_call_note_hash_read_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_note_hash_read_requests(2);
    let res = builder.private_call.note_hash_read_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(
        output.validation_requests.note_hash_read_requests.array,
        [res[0], res[1]],
    );
}

#[test]
fn propagate_from_private_call_nullifier_read_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_nullifier_read_requests(2);
    let res = builder.private_call.nullifier_read_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(
        output.validation_requests.nullifier_read_requests.array,
        [res[0], res[1]],
    );
}

#[test]
fn propagate_from_private_call_key_validation_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_key_validation_requests(2);
    let res = builder.private_call.scoped_key_validation_requests_and_generators.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(
        output.validation_requests.scoped_key_validation_requests_and_generators.array,
        [res[0], res[1]],
    );
}

#[test]
fn propagate_from_private_call_note_hashes_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_note_hashes(2);
    let res = builder.private_call.note_hashes.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(output.end.note_hashes.array, [res[0], res[1]]);
}

#[test]
fn propagate_from_private_call_nullifiers_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_nullifiers(2);
    let res = builder.private_call.nullifiers.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(output.end.nullifiers.array, [res[0], res[1]]);
}

#[test]
fn propagate_from_private_call_l2_to_l1_msgs_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_l2_to_l1_msgs(2);
    let res = builder.private_call.l2_to_l1_msgs.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(output.end.l2_to_l1_msgs.array, [res[0], res[1]]);
}

#[test]
fn propagate_from_private_call_private_logs_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_private_logs(2);
    let res = builder.private_call.private_logs.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(output.end.private_logs.array, [res[0], res[1]]);
}

#[test]
fn propagate_from_private_call_contract_class_log_hashes_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.add_contract_class_log_hash(2, 200);
    let res = builder.private_call.contract_class_logs_hashes.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(output.end.contract_class_logs_hashes.array, [res[0]]);
}

#[test]
fn propagate_from_private_call_private_call_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_private_call_requests(2);
    let res = builder.private_call.private_call_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    // Call requests will be propagated in reversed order.
    assert_array_eq(output.end.private_call_stack.array, [res[1], res[0]]);
}

#[test]
fn propagate_from_private_call_public_call_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.append_public_call_requests(2);
    let res = builder.private_call.public_call_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_array_eq(output.end.public_call_requests.array, [res[0], res[1]]);
}

#[test]
fn propagate_from_private_call_public_teardown_call_request_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.set_public_teardown_call_request();
    let res = builder.private_call.public_teardown_call_request;

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_eq(output.public_teardown_call_request, res);
}

#[test]
fn propagate_from_private_call_fee_payer_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    let fee_payer = builder.private_call.make_fee_payer();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_tx_request(false) };

    assert_eq(output.fee_payer, fee_payer);
}
