use crate::barretenberg_api::acir;

#[test]
fn test_acir_get_circuit_size() {
    let constraint_system_buf = [1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 51, 48, 54, 52, 52, 101, 55, 50, 101, 49, 51, 49, 97, 48, 50, 57, 98, 56, 53, 48, 52, 53, 98, 54, 56, 49, 56, 49, 53, 56, 53, 100, 50, 56, 51, 51, 101, 56, 52, 56, 55, 57, 98, 57, 55, 48, 57, 49, 52, 51, 101, 49, 102, 53, 57, 51, 102, 48, 48, 48, 48, 48, 48, 48, 2, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let circuit_sizes = unsafe { acir::get_circuit_sizes(&constraint_system_buf, true) };
    println!("{:?}", circuit_sizes);
    assert_eq!(circuit_sizes.total, 3560);
    assert_eq!(circuit_sizes.subgroup, 4096);
}

#[test]
fn test_acir_vk_as_fields_mega_honk() {
    // Load input data from vk_in_args.json
    let vk_in_args_json = include_str!("vk_in_args.json");
    let vk_in_args: serde_json::Value = serde_json::from_str(vk_in_args_json).unwrap();
    let vk_input: Vec<u8> = vk_in_args["data"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_u64().unwrap() as u8)
        .collect();

    // Load expected output data from vk_serialized.json
    let vk_serialized_json = include_str!("vk_serialized.json");
    let vk_serialized: serde_json::Value = serde_json::from_str(vk_serialized_json).unwrap();
    let expected_output: Vec<u8> = vk_serialized["data"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_u64().unwrap() as u8)
        .collect();

    // Call the function
    let result = unsafe { acir::acir_vk_as_fields_mega_honk(&vk_input) };

    // Compare the result with expected output
    assert_eq!(result.len(), expected_output.len(), "Output length mismatch");
    assert_eq!(result, expected_output, "Output data mismatch");
}
