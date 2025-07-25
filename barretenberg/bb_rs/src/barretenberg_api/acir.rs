use super::{bindgen, models::Ptr, traits::SerializeBuffer, Buffer};
use std::ptr;
use std::fmt::Write;
use num_bigint::BigUint;

#[derive(Debug)]
pub struct CircuitSizes {
    pub total: u32,
    pub subgroup: u32,
}

fn pack_proof_into_biguints(vec_u8: &[u8]) -> Vec<BigUint> {
    // We process the vector in chunks of 32 bytes
    vec_u8.chunks(32).map(|chunk| BigUint::from_bytes_be(chunk)).collect()
}

// TODO: Enable this once we know how to format the vk as fields
/*fn pack_vk_into_biguints(vec_u8: &[u8]) -> Vec<BigUint> {
    // We skip the first 97 bytes and then we process the rest in chunks of 32 bytes
    let mut biguints: Vec<BigUint> = Vec::new();
    // First 8 bytes are the subgroup size
    biguints.push(BigUint::from_bytes_be(&vec_u8[0..8]));
    // The 8 bytes after the subgroup size are ignored
    // Next 8 bytes are the number of public inputs (including the pairing inputs)
    biguints.push(BigUint::from_bytes_be(&vec_u8[16..24]));
    // Next 8 bytes are the public inputs offset
    biguints.push(BigUint::from_bytes_be(&vec_u8[24..32]));
    // What is this byte?
    biguints.push(BigUint::from(vec_u8[32]));
    // Another 16 bytes going from 1 to 16?
    biguints.extend(vec_u8[33..97].chunks(4).map(|chunk| BigUint::from_bytes_be(chunk)));
    // Then the actual vkey
    biguints.extend(vec_u8[97..].chunks(32)
    .flat_map(|chunk| {
        let mut biguints = Vec::new();
        biguints.push(BigUint::from_bytes_be(&chunk[15..32]));
        biguints.push(BigUint::from_bytes_be(&chunk[0..15]));
        biguints.into_iter()
    }));
    biguints
}*/

fn from_biguints_to_hex_strings(biguints: &[BigUint]) -> Vec<String> {
    biguints.iter().map(|biguint| format!("0x{:064x}", biguint)).collect()
}

pub unsafe fn get_circuit_sizes(constraint_system_buf: &[u8], recursive: bool) -> CircuitSizes {
    let mut total = 0;
    let mut subgroup = 0;
    let honk_recursion = true;
    bindgen::acir_get_circuit_sizes(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        &recursive,
        &honk_recursion,
        &mut total,
        &mut subgroup,
    );
    CircuitSizes {
        total: total.to_be(),
        subgroup: subgroup.to_be(),
    }
}

pub unsafe fn acir_prove_ultra_honk(
    constraint_system_buf: &[u8],
    witness_buf: &[u8],
    vkey_buf: &[u8],
) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_prove_ultra_honk(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        witness_buf.to_buffer().as_slice().as_ptr(),
        vkey_buf.as_ptr(),
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

pub unsafe fn acir_prove_ultra_keccak_honk(
    constraint_system_buf: &[u8],
    witness_buf: &[u8],
    vkey_buf: &[u8],
) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_prove_ultra_keccak_honk(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        witness_buf.to_buffer().as_slice().as_ptr(),
        vkey_buf.as_ptr(),
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

pub unsafe fn acir_prove_ultra_keccak_zk_honk(
    constraint_system_buf: &[u8],
    witness_buf: &[u8],
    vkey_buf: &[u8],
) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_prove_ultra_keccak_zk_honk(
        constraint_system_buf.to_buffer().as_slice().as_ptr(),
        witness_buf.to_buffer().as_slice().as_ptr(),
        vkey_buf.as_ptr(),
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

pub unsafe fn acir_get_ultra_honk_verification_key(constraint_system_buf: &[u8]) -> Vec<u8> {
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

pub unsafe fn acir_get_ultra_honk_keccak_verification_key(constraint_system_buf: &[u8]) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_write_vk_ultra_keccak_honk(
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

pub unsafe fn acir_get_ultra_honk_keccak_zk_verification_key(constraint_system_buf: &[u8]) -> Vec<u8> {
    let mut out_ptr = ptr::null_mut();
    bindgen::acir_write_vk_ultra_keccak_zk_honk(
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

pub unsafe fn acir_verify_ultra_honk(proof_buf: &[u8], vkey_buf: &[u8]) -> bool {
    let mut result = false;
    bindgen::acir_verify_ultra_honk(
        proof_buf.to_buffer().as_ptr(),
        vkey_buf.as_ptr(),
        &mut result,
    );
    result
}

pub unsafe fn acir_verify_ultra_keccak_honk(proof_buf: &[u8], vkey_buf: &[u8]) -> bool {
    let mut result = false;
    bindgen::acir_verify_ultra_keccak_honk(
        proof_buf.to_buffer().as_ptr(),
        vkey_buf.as_ptr(),
        &mut result,
    );
    result
}

pub unsafe fn acir_verify_ultra_keccak_zk_honk(proof_buf: &[u8], vkey_buf: &[u8]) -> bool {
    let mut result = false;
    bindgen::acir_verify_ultra_keccak_zk_honk(
        proof_buf.to_buffer().as_ptr(),
        vkey_buf.as_ptr(),
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
    from_biguints_to_hex_strings(&pack_proof_into_biguints(&proof_buf))
}

/*pub unsafe fn acir_vk_as_fields_ultra_honk(vk_buf: &[u8]) -> Vec<String> {
    from_biguints_to_hex_strings(&pack_vk_into_biguints(&vk_buf))
}*/
