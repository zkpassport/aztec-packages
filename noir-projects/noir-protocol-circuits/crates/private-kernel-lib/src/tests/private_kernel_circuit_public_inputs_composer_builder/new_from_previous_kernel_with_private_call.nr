use crate::tests::private_kernel_circuit_public_inputs_composer_builder::PrivateKernelCircuitPublicInputsComposerBuilder;
use dep::types::{constants::DEFAULT_UPDATE_DELAY, tests::utils::assert_array_eq, traits::Empty};

#[test]
fn new_from_previous_kernel_with_private_call_empty_data_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(
        output.validation_requests.for_rollup.include_by_timestamp.unwrap_unchecked(),
        DEFAULT_UPDATE_DELAY,
    );
    assert(output.public_teardown_call_request.is_empty());
    assert(output.fee_payer.is_empty());
}

#[test]
fn new_from_previous_kernel_with_private_call_min_revertible_side_effect_counter_prev_empty_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.min_revertible_side_effect_counter = 3;

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.min_revertible_side_effect_counter, 3);
}

#[test]
fn new_from_previous_kernel_with_private_call_min_revertible_side_effect_counter_curr_empty_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.min_revertible_side_effect_counter = 3;

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.min_revertible_side_effect_counter, 3);
}

#[test(should_fail_with = "cannot overwrite non-zero min_revertible_side_effect_counter")]
fn new_from_previous_kernel_with_private_call_min_revertible_side_effect_counter_overwrite_fails() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.min_revertible_side_effect_counter = 3;
    builder.private_call.min_revertible_side_effect_counter = 3;

    // Safety: this is a test
    let _ = unsafe { builder.compose_from_previous_kernel() };
}

#[test]
fn new_from_previous_kernel_with_private_call_include_by_timestamp_prev_empty_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.set_include_by_timestamp(3);

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.validation_requests.for_rollup.include_by_timestamp.unwrap(), 3);
}

#[test]
fn new_from_previous_kernel_with_private_call_include_by_timestamp_curr_empty_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.set_include_by_timestamp(3);

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.validation_requests.for_rollup.include_by_timestamp.unwrap(), 3);
}

#[test]
fn new_from_previous_kernel_with_private_call_include_by_timestamp_pick_prev_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.set_include_by_timestamp(3);
    builder.private_call.set_include_by_timestamp(4);

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.validation_requests.for_rollup.include_by_timestamp.unwrap(), 3);
}

#[test]
fn new_from_previous_kernel_with_private_call_include_by_timestamp_pick_curr_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.set_include_by_timestamp(4);
    builder.private_call.set_include_by_timestamp(3);

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.validation_requests.for_rollup.include_by_timestamp.unwrap(), 3);
}

#[test]
fn new_from_previous_kernel_with_private_call_note_hash_read_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_note_hash_read_requests(2);
    let prev = builder.previous_kernel.note_hash_read_requests.storage();
    builder.private_call.append_note_hash_read_requests(2);
    let curr = builder.private_call.note_hash_read_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.validation_requests.note_hash_read_requests.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_nullifier_read_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_nullifier_read_requests(2);
    let prev = builder.previous_kernel.nullifier_read_requests.storage();
    builder.private_call.append_nullifier_read_requests(2);
    let curr = builder.private_call.nullifier_read_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.validation_requests.nullifier_read_requests.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_key_validation_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_key_validation_requests(2);
    let prev = builder.previous_kernel.scoped_key_validation_requests_and_generators.storage();
    builder.private_call.append_key_validation_requests(2);
    let curr = builder.private_call.scoped_key_validation_requests_and_generators.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.validation_requests.scoped_key_validation_requests_and_generators.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_note_hashes_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_note_hashes(2);
    let prev = builder.previous_kernel.note_hashes.storage();
    builder.private_call.append_note_hashes(2);
    let curr = builder.private_call.note_hashes.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.end.note_hashes.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_nullifiers_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_nullifiers(2);
    let prev = builder.previous_kernel.nullifiers.storage();
    builder.private_call.append_nullifiers(2);
    let curr = builder.private_call.nullifiers.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.end.nullifiers.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_l2_to_l1_msgs_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_l2_to_l1_msgs(1);
    let prev = builder.previous_kernel.l2_to_l1_msgs.storage();
    builder.private_call.append_l2_to_l1_msgs(1);
    let curr = builder.private_call.l2_to_l1_msgs.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(output.end.l2_to_l1_msgs.array, [prev[0], curr[0]]);
}

#[test]
fn new_from_previous_kernel_with_private_call_private_logs_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_private_logs(2);
    let prev = builder.previous_kernel.private_logs.storage();
    builder.private_call.append_private_logs(2);
    let curr = builder.private_call.private_logs.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.end.private_logs.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_contract_class_log_hashes_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.add_contract_class_log_hash(2, 200);
    let curr = builder.private_call.contract_class_logs_hashes.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(output.end.contract_class_logs_hashes.array, [curr[0]]);
}

#[test]
fn new_from_previous_kernel_with_private_call_private_call_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_private_call_requests(2);
    let prev = builder.previous_kernel.private_call_requests.storage();
    builder.private_call.append_private_call_requests(2);
    let curr = builder.private_call.private_call_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    // Call requests from private call will be propagated in reversed order.
    assert_array_eq(
        output.end.private_call_stack.array,
        [prev[1], prev[0], curr[1], curr[0]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_public_call_requests_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.append_public_call_requests(2);
    let prev = builder.previous_kernel.public_call_requests.storage();
    builder.private_call.append_public_call_requests(2);
    let curr = builder.private_call.public_call_requests.storage();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_array_eq(
        output.end.public_call_requests.array,
        [prev[0], prev[1], curr[0], curr[1]],
    );
}

#[test]
fn new_from_previous_kernel_with_private_call_public_teardown_call_request_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.private_call.set_public_teardown_call_request();
    let request = builder.private_call.public_teardown_call_request;

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.public_teardown_call_request, request);
}

#[test(should_fail_with = "Public teardown call request already set")]
fn new_from_previous_kernel_with_private_call_public_teardown_call_request_overwrite_fails() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    builder.previous_kernel.set_public_teardown_call_request();
    builder.private_call.set_public_teardown_call_request();

    // Safety: this is a test
    let _ = unsafe { builder.compose_from_previous_kernel() };
}

#[test]
fn new_from_previous_kernel_with_private_call_fee_payer_succeeds() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    let fee_payer = builder.private_call.make_fee_payer();

    // Safety: this is a test
    let output = unsafe { builder.compose_from_previous_kernel() };

    assert_eq(output.fee_payer, fee_payer);
}

#[test(should_fail_with = "Cannot overwrite non-empty fee_payer")]
fn new_from_previous_kernel_with_private_call_fee_payer_overwrite_fails() {
    let mut builder = PrivateKernelCircuitPublicInputsComposerBuilder::new();

    let _ = builder.previous_kernel.make_fee_payer();
    let _ = builder.private_call.make_fee_payer();

    // Safety: this is a test
    let _ = unsafe { builder.compose_from_previous_kernel() };
}
