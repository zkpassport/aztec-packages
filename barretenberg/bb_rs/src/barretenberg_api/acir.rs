use super::{bindgen, models::Ptr, traits::SerializeBuffer, Buffer};
use std::ptr;
use std::fmt::Write;

#[derive(Debug)]
pub struct CircuitSizes {
    pub exact: u32,
    pub total: u32,
    pub subgroup: u32,
}

fn from_buffer_to_fields(buffer: &[u8], size_in_bytes: u32, offset: u32) -> Vec<String> {
    let mut result = Vec::new();

    // Process the buffer in chunks of {size_in_bytes} bytes
    for chunk in buffer[offset as usize..].chunks(size_in_bytes as usize) {
         // Pre-allocate space for {size_in_bytes} bytes ({size_in_bytes} * 2 hex chars)
        let mut hex_string = String::with_capacity((size_in_bytes * 2) as usize);

        // Convert each chunk to a hexadecimal string
        for &byte in chunk.iter() {
            write!(&mut hex_string, "{:02x}", byte).expect("Unable to write to string");
        }

        // Prefix each field with "0x" and push it to the final Vector
        result.push(format!("0x{}", hex_string));
    }

    result
}

pub unsafe fn get_circuit_sizes(constraint_system_buf: &[u8], honk_recursion: bool) -> CircuitSizes {
    let mut exact = 0;
    let mut total = 0;
    let mut subgroup = 0;
    bindgen::acir_get_circuit_sizes(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        &honk_recursion,
        &mut exact,
        &mut total,
        &mut subgroup,
    );
    CircuitSizes {
        exact: exact.to_be(),
        total: total.to_be(),
        subgroup: subgroup.to_be(),
    }
}

pub unsafe fn new_acir_composer(size_hint: u32) -> Ptr {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_new_acir_composer(size_hint.to_be_bytes().as_ptr() as *const u32, &mut out_ptr);
    out_ptr
}

pub unsafe fn delete_acir_composer(acir_composer_ptr: Ptr) {
    bindgen::acir_delete_acir_composer(&acir_composer_ptr);
}

pub unsafe fn acir_init_proving_key(acir_composer_ptr: &mut Ptr, constraint_system_buf: &[u8]) {
    bindgen::acir_init_proving_key(
        acir_composer_ptr,
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
    );
}

pub unsafe fn acir_create_proof(
    acir_composer_ptr: &mut Ptr,
    constraint_system_buf: &[u8],
    witness_buf: &[u8],
) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_create_proof(
        acir_composer_ptr,
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        witness_buf.to_buffer().as_slice().as_ptr(),
        &mut out_ptr,
    );
    Buffer::from_ptr(
        Buffer::from_ptr(out_ptr)
            .unwrap()
            .to_vec()
            .as_slice()
            .as_ptr(),
    )
    .unwrap()
    .to_vec()
}

pub unsafe fn acir_prove_ultra_honk(
    constraint_system_buf: &[u8],
    witness_buf: &[u8],
) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_prove_ultra_honk(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        witness_buf.to_buffer().as_slice().as_ptr(),
        &mut out_ptr,
    );
    Buffer::from_ptr(
        Buffer::from_ptr(out_ptr)
            .unwrap()
            .to_vec()
            .as_slice()
            .as_ptr(),
    )
    .unwrap()
    .to_vec()
}


pub unsafe fn acir_load_verification_key(acir_composer_ptr: &mut Ptr, vk_buf: &[u8]) {
    bindgen::acir_load_verification_key(acir_composer_ptr, vk_buf.as_ptr());
}

pub unsafe fn acir_init_verification_key(acir_composer_ptr: &mut Ptr) {
    bindgen::acir_init_verification_key(acir_composer_ptr);
}

pub unsafe fn acir_get_verification_key(acir_composer_ptr: &mut Ptr) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_get_verification_key(acir_composer_ptr, &mut out_ptr);
    Buffer::from_ptr(
        Buffer::from_ptr(out_ptr)
            .unwrap()
            .to_vec()
            .as_slice()
            .as_ptr(),
    )
    .unwrap()
    .to_vec()
}

pub unsafe fn acir_get_honk_verification_key(constraint_system_buf: &[u8]) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_write_vk_ultra_honk(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        &mut out_ptr
    );
    Buffer::from_ptr(
        Buffer::from_ptr(out_ptr)
            .unwrap()
            .to_vec()
            .as_slice()
            .as_ptr(),
    )
    .unwrap()
    .to_vec()
}

pub unsafe fn acir_get_proving_key(acir_composer_ptr: &mut Ptr, acir_vec: &[u8]) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_get_proving_key(
        acir_composer_ptr,
        acir_vec.to_buffer().as_slice().as_ptr(),
        &mut out_ptr,
    );
    Buffer::from_ptr(out_ptr).unwrap().to_vec()
}

pub unsafe fn acir_verify_proof(acir_composer_ptr: &mut Ptr, proof_buf: &[u8]) -> bool {
    let mut result = false;
    bindgen::acir_verify_proof(
        acir_composer_ptr,
        proof_buf.to_buffer().as_ptr(),
        &mut result,
    );
    result
}

pub unsafe fn acir_verify_ultra_honk(proof_buf: &[u8], vkey_buf: &[u8]) -> bool {
    let mut result = false;
    bindgen::acir_verify_ultra_honk(
        proof_buf.to_buffer().as_ptr(),
        vkey_buf.to_buffer().as_ptr(),
        &mut result,
    );
    result
}

pub unsafe fn acir_prove_and_verify_ultra_honk(constraint_system_buf: &[u8], witness_buf: &[u8]) -> bool {
    let mut result = false;
    bindgen::acir_prove_and_verify_ultra_honk(
        constraint_system_buf.to_buffer().as_ptr(),
        witness_buf.to_buffer().as_ptr(),
        &mut result,
    );
    result
}

pub unsafe fn acir_serialize_proof_into_fields(
    acir_composer_ptr: &mut Ptr,
    proof_buf: &[u8],
    num_inner_public_inputs: u32,
) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_serialize_proof_into_fields(
        acir_composer_ptr,
        proof_buf.to_buffer().as_ptr(),
        &num_inner_public_inputs.to_be(),
        &mut out_ptr,
    );
    Buffer::from_ptr(out_ptr).unwrap().to_vec()
}

pub unsafe fn acir_serialize_verification_key_into_fields(
    acir_composer_ptr: &mut Ptr,
) -> (Vec<u8>, [u8; 32]) {
    let mut out_vkey = ptr::null_mut();
    let mut out_key_hash = [0; 32];
    bindgen::acir_serialize_verification_key_into_fields(
        acir_composer_ptr,
        &mut out_vkey,
        out_key_hash.as_mut_ptr(),
    );
    (Buffer::from_ptr(out_vkey).unwrap().to_vec(), out_key_hash)
}

pub unsafe fn acir_proof_as_fields_ultra_honk(proof_buf: &[u8]) -> Vec<String> {
    // NOTE: the output will be the same as the input, but this will fail if the input is not a well formatted proof
    // so you can see this as a validation function for the format of the proof
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_proof_as_fields_ultra_honk(
        proof_buf.to_buffer().as_ptr(),
        &mut out_ptr,
    );
    // We remove the first 4 bytes and keep the rest
    // The first 3 fields are the circuit size, the number of public inputs (+ 16 for recursive proofs)
    // and the offset of the public inputs. Then the public inputs and the rest is the actual proof
    from_buffer_to_fields(&Buffer::from_ptr(out_ptr).unwrap().to_vec(), 32, 4)
}

pub unsafe fn acir_vk_as_fields_ultra_honk(vk_buf: &[u8]) -> (Vec<String>, String) {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_vk_as_fields_ultra_honk(
        vk_buf.to_buffer().as_ptr(),
        &mut out_ptr,
    );
    // We remove the first 4 bytes and the 3 first fields
    // As for the proof the 3 first fields are the circuit size, the number of public inputs and the offset of the public inputs
    // But for some reason the values are not correct for the verification key so we remove them, so we can add them later from the proof
    let vk: Vec<String> = from_buffer_to_fields(&Buffer::from_ptr(out_ptr).unwrap().to_vec(), 32, 100);
    let key_hash = vk[vk.len()-1].clone();
    (vk[0..vk.len()-1].to_vec(), key_hash)
}