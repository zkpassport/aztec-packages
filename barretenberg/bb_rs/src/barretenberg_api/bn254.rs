use super::{
    bindgen,
    models::{Fr, Fq, Point},
    traits::{DeserializeBuffer, SerializeBuffer},
};

// ========== BN254 Fr (scalar field) ==========

/// Compute the square root of a field element in BN254's Fr field
/// Returns Some(sqrt) if the square root exists, None otherwise
pub unsafe fn bn254_fr_sqrt(input: &Fr) -> Option<Fr> {
    let mut result_buf = [0u8; 33]; // 1 byte for boolean + 32 bytes for Fr
    bindgen::bn254_fr_sqrt(
        input.to_buffer().as_slice().as_ptr(),
        result_buf.as_mut_ptr(),
    );
    
    // First byte indicates whether a square root exists
    let is_sqrt = result_buf[0] == 1;
    
    if is_sqrt {
        // Extract the square root from the remaining 32 bytes
        let mut sqrt_buf = [0u8; 32];
        sqrt_buf.copy_from_slice(&result_buf[1..33]);
        Some(Fr::from_buffer(sqrt_buf))
    } else {
        None
    }
}

// ========== BN254 Fq (base field) ==========

/// Compute the square root of a field element in BN254's Fq field (base field)
/// Returns Some(sqrt) if the square root exists, None otherwise
pub unsafe fn bn254_fq_sqrt(input: &Fq) -> Option<Fq> {
    let mut result_buf = [0u8; 33]; // 1 byte for boolean + 32 bytes for Fq
    bindgen::bn254_fq_sqrt(
        input.to_buffer().as_slice().as_ptr(),
        result_buf.as_mut_ptr(),
    );
    
    let is_sqrt = result_buf[0] == 1;
    
    if is_sqrt {
        let mut sqrt_buf = [0u8; 32];
        sqrt_buf.copy_from_slice(&result_buf[1..33]);
        Some(Fq::from_buffer(sqrt_buf))
    } else {
        None
    }
}

// ========== BN254 G1 curve operations ==========

/// BN254 G1 point multiplication: point * scalar
pub unsafe fn ecc_bn254_g1__mul(point: &Point, scalar: &Fr) -> Point {
    let mut result_buf = [0u8; 64];
    bindgen::ecc_bn254_g1__mul(
        point.to_buffer().as_slice().as_ptr(),
        scalar.to_buffer().as_slice().as_ptr(),
        result_buf.as_mut_ptr(),
    );
    Point::from_buffer(result_buf)
}

/// BN254 G1 point addition: point_a + point_b
pub unsafe fn ecc_bn254_g1__add(point_a: &Point, point_b: &Point) -> Point {
    let mut result_buf = [0u8; 64];
    bindgen::ecc_bn254_g1__add(
        point_a.to_buffer().as_slice().as_ptr(),
        point_b.to_buffer().as_slice().as_ptr(),
        result_buf.as_mut_ptr(),
    );
    Point::from_buffer(result_buf)
}

/// BN254 G1 point negation: -point
pub unsafe fn ecc_bn254_g1__neg(point: &Point) -> Point {
    let mut result_buf = [0u8; 64];
    bindgen::ecc_bn254_g1__neg(
        point.to_buffer().as_slice().as_ptr(),
        result_buf.as_mut_ptr(),
    );
    Point::from_buffer(result_buf)
}

/// BN254 G1 point equality check
pub unsafe fn ecc_bn254_g1__eq(point_a: &Point, point_b: &Point) -> bool {
    let mut result = false;
    bindgen::ecc_bn254_g1__eq(
        point_a.to_buffer().as_slice().as_ptr(),
        point_b.to_buffer().as_slice().as_ptr(),
        &mut result,
    );
    result
}

/// Check if a point is on the BN254 G1 curve
pub unsafe fn ecc_bn254_g1__is_on_curve(point: &Point) -> bool {
    let mut result = false;
    bindgen::ecc_bn254_g1__is_on_curve(
        point.to_buffer().as_slice().as_ptr(),
        &mut result,
    );
    result
}

/// BN254 G1 batch point multiplication: multiply each point by the same scalar
pub unsafe fn ecc_bn254_g1__batch_mul(points: &[Point], scalar: &Fr) -> Vec<Point> {
    let num_points = points.len() as u32;
    
    // Serialize all points into a single buffer
    let mut points_buf = Vec::with_capacity(points.len() * 64);
    for point in points {
        points_buf.extend_from_slice(&point.to_buffer());
    }
    
    // Prepare result buffer
    let mut result_buf = vec![0u8; points.len() * 64];
    
    bindgen::ecc_bn254_g1__batch_mul(
        points_buf.as_ptr(),
        scalar.to_buffer().as_slice().as_ptr(),
        num_points,
        result_buf.as_mut_ptr(),
    );
    
    // Deserialize results
    let mut results = Vec::with_capacity(points.len());
    for i in 0..points.len() {
        let start = i * 64;
        let end = start + 64;
        let mut point_buf = [0u8; 64];
        point_buf.copy_from_slice(&result_buf[start..end]);
        results.push(Point::from_buffer(point_buf));
    }
    
    results
}

// ========== BN254 G2 curve operations ==========
// Note: G2 points are 128 bytes (4x32 bytes for Fq2 x and y coordinates)

/// BN254 G2 point representation (128 bytes)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct G2Point {
    pub data: [u8; 128],
}

impl G2Point {
    pub fn from_buffer(buf: [u8; 128]) -> Self {
        Self { data: buf }
    }
    
    pub fn to_buffer(&self) -> [u8; 128] {
        self.data
    }
}

/// BN254 G2 point multiplication: point * scalar
pub unsafe fn ecc_bn254_g2__mul(point: &G2Point, scalar: &Fr) -> G2Point {
    let mut result_buf = [0u8; 128];
    bindgen::ecc_bn254_g2__mul(
        point.data.as_ptr(),
        scalar.to_buffer().as_slice().as_ptr(),
        result_buf.as_mut_ptr(),
    );
    G2Point::from_buffer(result_buf)
}

/// BN254 G2 point addition: point_a + point_b
pub unsafe fn ecc_bn254_g2__add(point_a: &G2Point, point_b: &G2Point) -> G2Point {
    let mut result_buf = [0u8; 128];
    bindgen::ecc_bn254_g2__add(
        point_a.data.as_ptr(),
        point_b.data.as_ptr(),
        result_buf.as_mut_ptr(),
    );
    G2Point::from_buffer(result_buf)
}

/// BN254 G2 point negation: -point
pub unsafe fn ecc_bn254_g2__neg(point: &G2Point) -> G2Point {
    let mut result_buf = [0u8; 128];
    bindgen::ecc_bn254_g2__neg(
        point.data.as_ptr(),
        result_buf.as_mut_ptr(),
    );
    G2Point::from_buffer(result_buf)
}

/// BN254 G2 point equality check
pub unsafe fn ecc_bn254_g2__eq(point_a: &G2Point, point_b: &G2Point) -> bool {
    let mut result = false;
    bindgen::ecc_bn254_g2__eq(
        point_a.data.as_ptr(),
        point_b.data.as_ptr(),
        &mut result,
    );
    result
}
