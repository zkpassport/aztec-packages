use super::bindgen;

// TODO: _g2_point_buf no longer needed by bindgen::srs_init_srs
pub unsafe fn init_srs(points_buf: &[u8], num_points: u32, _g2_point_buf: &[u8]) {
    bindgen::srs_init_srs(
        points_buf.as_ptr(),
        &num_points.to_be(),
    );
}

pub unsafe fn init_grumpkin_srs(points_buf: &[u8], num_points: u32) {
    bindgen::srs_init_grumpkin_srs(
        points_buf.as_ptr(),
        &num_points.to_be(),
    );
}
