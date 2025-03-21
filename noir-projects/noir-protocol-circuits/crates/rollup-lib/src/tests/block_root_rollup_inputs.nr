use crate::block_root::BlockRootRollupInputs;
use crate::tests::l1_to_l2_roots::default_root_rollup_parity_input;
use crate::tests::previous_rollup_data::default_previous_rollup_data;
use dep::types::{
    abis::append_only_tree_snapshot::AppendOnlyTreeSnapshot,
    constants::{
        ARCHIVE_HEIGHT, L1_TO_L2_MSG_SUBTREE_HEIGHT, L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH,
        L1_TO_L2_MSG_TREE_HEIGHT,
    },
    tests::merkle_tree_utils::compute_zero_hashes,
};

pub fn compute_l1_l2_empty_snapshot() -> (AppendOnlyTreeSnapshot, [Field; L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH]) {
    let zero_hashes = compute_zero_hashes([0; L1_TO_L2_MSG_TREE_HEIGHT]);
    let mut l1_to_l2_message_subtree_sibling_path = [0; L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH];

    for i in 0..L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH {
        let index = L1_TO_L2_MSG_SUBTREE_HEIGHT + i - 1;
        l1_to_l2_message_subtree_sibling_path[i] = zero_hashes[index];
    }

    (
        AppendOnlyTreeSnapshot {
            root: zero_hashes[zero_hashes.len() - 1],
            next_available_leaf_index: 0,
        }, l1_to_l2_message_subtree_sibling_path,
    )
}

pub fn compute_archive_snapshot() -> (AppendOnlyTreeSnapshot, [Field; ARCHIVE_HEIGHT]) {
    let zero_hashes = compute_zero_hashes([0; ARCHIVE_HEIGHT]);
    let mut sibling_path = [0; ARCHIVE_HEIGHT];
    for i in 1..ARCHIVE_HEIGHT {
        sibling_path[i] = zero_hashes[i - 1];
    }
    (
        AppendOnlyTreeSnapshot {
            root: zero_hashes[zero_hashes.len() - 1],
            next_available_leaf_index: 0,
        }, sibling_path,
    )
}

pub fn default_block_root_rollup_inputs() -> BlockRootRollupInputs {
    let mut inputs = BlockRootRollupInputs::empty();

    inputs.l1_to_l2_roots = default_root_rollup_parity_input();

    let (l1_l2_empty_snapshot, l1_l2_empty_sibling_path) = compute_l1_l2_empty_snapshot();

    inputs.l1_to_l2_message_subtree_sibling_path = l1_l2_empty_sibling_path;
    inputs.start_l1_to_l2_message_tree_snapshot = l1_l2_empty_snapshot;

    let (blocks_snapshot, blocks_sibling_path) = compute_archive_snapshot();

    inputs.start_archive_snapshot = blocks_snapshot;
    inputs.new_archive_sibling_path = blocks_sibling_path;

    inputs.previous_rollup_data = default_previous_rollup_data();

    inputs
}
