/**
 * @file Metric names used in Aztec.
 * Metric names must be unique and not clash with {@link attributes.ts | Attribute names}.
 * Prefix metric names with `aztec` and use dots `.` to separate namespaces.
 *
 * @see {@link https://opentelemetry.io/docs/specs/semconv/general/metrics/ | OpenTelemetry Metrics} for naming conventions.
 */

export const BLOB_SINK_STORE_REQUESTS = 'aztec.blob_sink.store_request_count';
export const BLOB_SINK_RETRIEVE_REQUESTS = 'aztec.blob_sink.retrieve_request_count';
export const BLOB_SINK_OBJECTS_IN_BLOB_STORE = 'aztec.blob_sink.objects_in_blob_store';
export const BLOB_SINK_BLOB_SIZE = 'aztec.blob_sink.blob_size';

export const BLOB_SINK_ARCHIVE_BLOB_REQUEST_COUNT = 'aztec.blob_sink.archive.block_request_count';
export const BLOB_SINK_ARCHIVE_BLOCK_REQUEST_COUNT = 'aztec.blob_sink.archive.blob_request_count';
export const BLOB_SINK_ARCHIVE_BLOB_COUNT = 'aztec.blob_sink.archive.blob_count';

/** How long it takes to simulate a circuit */
export const CIRCUIT_SIMULATION_DURATION = 'aztec.circuit.simulation.duration';
export const CIRCUIT_SIMULATION_INPUT_SIZE = 'aztec.circuit.simulation.input_size';
export const CIRCUIT_SIMULATION_OUTPUT_SIZE = 'aztec.circuit.simulation.output_size';

export const CIRCUIT_WITNESS_GEN_DURATION = 'aztec.circuit.witness_generation.duration';
export const CIRCUIT_WITNESS_GEN_INPUT_SIZE = 'aztec.circuit.witness_generation.input_size';
export const CIRCUIT_WITNESS_GEN_OUTPUT_SIZE = 'aztec.circuit.witness_generation.output_size';

export const CIRCUIT_PROVING_DURATION = 'aztec.circuit.proving.duration';
export const CIRCUIT_PROVING_INPUT_SIZE = 'aztec.circuit.proving.input_size';
export const CIRCUIT_PROVING_PROOF_SIZE = 'aztec.circuit.proving.proof_size';

export const CIRCUIT_PUBLIC_INPUTS_COUNT = 'aztec.circuit.public_inputs_count';
export const CIRCUIT_GATE_COUNT = 'aztec.circuit.gate_count';
export const CIRCUIT_SIZE = 'aztec.circuit.size';

export const MEMPOOL_TX_COUNT = 'aztec.mempool.tx_count';
export const MEMPOOL_TX_SIZE = 'aztec.mempool.tx_size';
export const DB_NUM_ITEMS = 'aztec.db.num_items';
export const DB_MAP_SIZE = 'aztec.db.map_size';
export const DB_PHYSICAL_FILE_SIZE = 'aztec.db.physical_file_size';
export const DB_USED_SIZE = 'aztec.db.used_size';

export const MEMPOOL_ATTESTATIONS_COUNT = 'aztec.mempool.attestations_count';
export const MEMPOOL_ATTESTATIONS_SIZE = 'aztec.mempool.attestations_size';

export const ARCHIVER_L1_BLOCK_HEIGHT = 'aztec.archiver.l1_block_height';
export const ARCHIVER_BLOCK_HEIGHT = 'aztec.archiver.block_height';
export const ARCHIVER_ROLLUP_PROOF_DELAY = 'aztec.archiver.rollup_proof_delay';
export const ARCHIVER_ROLLUP_PROOF_COUNT = 'aztec.archiver.rollup_proof_count';

export const ARCHIVER_MANA_PER_BLOCK = 'aztec.archiver.block.mana_count';
export const ARCHIVER_TXS_PER_BLOCK = 'aztec.archiver.block.tx_count';
export const ARCHIVER_SYNC_PER_BLOCK = 'aztec.archiver.block.sync_per_item_duration';
export const ARCHIVER_SYNC_BLOCK_COUNT = 'aztec.archiver.block.sync_count';

export const ARCHIVER_SYNC_PER_MESSAGE = 'aztec.archiver.message.sync_per_item_duration';
export const ARCHIVER_SYNC_MESSAGE_COUNT = 'aztec.archiver.message.sync_count';

export const ARCHIVER_PRUNE_DURATION = 'aztec.archiver.prune_duration';
export const ARCHIVER_PRUNE_COUNT = 'aztec.archiver.prune_count';

export const ARCHIVER_TOTAL_TXS = 'aztec.archiver.tx_count';

export const NODE_RECEIVE_TX_DURATION = 'aztec.node.receive_tx.duration';
export const NODE_RECEIVE_TX_COUNT = 'aztec.node.receive_tx.count';

export const SEQUENCER_STATE_TRANSITION_BUFFER_DURATION = 'aztec.sequencer.state_transition_buffer.duration';
export const SEQUENCER_BLOCK_BUILD_DURATION = 'aztec.sequencer.block.build_duration';
export const SEQUENCER_BLOCK_BUILD_MANA_PER_SECOND = 'aztec.sequencer.block.build_mana_per_second';
export const SEQUENCER_BLOCK_COUNT = 'aztec.sequencer.block.count';
export const SEQUENCER_CURRENT_STATE = 'aztec.sequencer.current.state';
export const SEQUENCER_CURRENT_BLOCK_NUMBER = 'aztec.sequencer.current.block_number';
export const SEQUENCER_CURRENT_BLOCK_SIZE = 'aztec.sequencer.current.block_size';
export const SEQUENCER_BLOCK_BUILD_INSERTION_TIME = 'aztec.sequencer.block_builder_tree_insertion_duration';
export const SEQUENCER_CURRENT_BLOCK_REWARDS = 'aztec.sequencer.current_block_rewards';
export const SEQUENCER_SLOT_COUNT = 'aztec.sequencer.slot.total_count';
export const SEQUENCER_FILLED_SLOT_COUNT = 'aztec.sequencer.slot.filled_count';
export const SEQUENCER_MISSED_SLOT_COUNT = 'aztec.sequencer.slot.missed_count';

export const SEQUENCER_COLLECTED_ATTESTATIONS_COUNT = 'aztec.sequencer.attestations.collected_count';
export const SEQUENCER_REQUIRED_ATTESTATIONS_COUNT = 'aztec.sequencer.attestations.required_count';
export const SEQUENCER_COLLECT_ATTESTATIONS_DURATION = 'aztec.sequencer.attestations.collect_duration';
export const SEQUENCER_COLLECT_ATTESTATIONS_TIME_ALLOWANCE = 'aztec.sequencer.attestations.collect_allowance';

export const L1_PUBLISHER_GAS_PRICE = 'aztec.l1_publisher.gas_price';
export const L1_PUBLISHER_TX_COUNT = 'aztec.l1_publisher.tx_count';
export const L1_PUBLISHER_TX_DURATION = 'aztec.l1_publisher.tx_duration';
export const L1_PUBLISHER_TX_GAS = 'aztec.l1_publisher.tx_gas';
export const L1_PUBLISHER_TX_CALLDATA_SIZE = 'aztec.l1_publisher.tx_calldata_size';
export const L1_PUBLISHER_TX_CALLDATA_GAS = 'aztec.l1_publisher.tx_calldata_gas';
export const L1_PUBLISHER_TX_BLOBDATA_GAS_USED = 'aztec.l1_publisher.tx_blobdata_gas_used';
export const L1_PUBLISHER_TX_BLOBDATA_GAS_COST = 'aztec.l1_publisher.tx_blobdata_gas_cost';
export const L1_PUBLISHER_BLOB_COUNT = 'aztec.l1_publisher.blob_count';
export const L1_PUBLISHER_BLOB_INCLUSION_BLOCKS = 'aztec.l1_publisher.blob_inclusion_blocks';
export const L1_PUBLISHER_BLOB_TX_SUCCESS = 'aztec.l1_publisher.blob_tx_success';
export const L1_PUBLISHER_BLOB_TX_FAILURE = 'aztec.l1_publisher.blob_tx_failure';
export const L1_PUBLISHER_BALANCE = 'aztec.l1_publisher.balance';
export const L1_PUBLISHER_TX_TOTAL_FEE = 'aztec.l1_publisher.tx_total_fee';

export const L1_BLOCK_HEIGHT = 'aztec.l1.block_height';
export const L1_BALANCE_ETH = 'aztec.l1.balance';
export const L1_GAS_PRICE_WEI = 'aztec.l1.gas_price';
export const L1_BLOB_BASE_FEE_WEI = 'aztec.l1.blob_base_fee';

export const PEER_MANAGER_GOODBYES_SENT = 'aztec.peer_manager.goodbyes_sent';
export const PEER_MANAGER_GOODBYES_RECEIVED = 'aztec.peer_manager.goodbyes_received';
export const PEER_MANAGER_PEER_COUNT = 'aztec.peer_manager.peer_count';

export const P2P_REQ_RESP_SENT_REQUESTS = 'aztec.p2p.req_resp.sent_requests';
export const P2P_REQ_RESP_RECEIVED_REQUESTS = 'aztec.p2p.req_resp.received_requests';
export const P2P_REQ_RESP_FAILED_OUTBOUND_REQUESTS = 'aztec.p2p.req_resp.failed_outbound_requests';
export const P2P_REQ_RESP_FAILED_INBOUND_REQUESTS = 'aztec.p2p.req_resp.failed_inbound_requests';

export const P2P_GOSSIP_MESSAGE_VALIDATION_DURATION = 'aztec.p2p.gossip.message_validation_duration';
export const P2P_GOSSIP_MESSAGE_PREVALIDATION_COUNT = 'aztec.p2p.gossip.message_validation_count';
export const P2P_GOSSIP_MESSAGE_LATENCY = 'aztec.p2p.gossip.message_latency';

export const P2P_GOSSIP_AGG_MESSAGE_LATENCY_MIN = 'aztec.p2p.gossip.agg_message_latency_min';
export const P2P_GOSSIP_AGG_MESSAGE_LATENCY_MAX = 'aztec.p2p.gossip.agg_message_latency_max';
export const P2P_GOSSIP_AGG_MESSAGE_LATENCY_P50 = 'aztec.p2p.gossip.agg_message_latency_p50';
export const P2P_GOSSIP_AGG_MESSAGE_LATENCY_P90 = 'aztec.p2p.gossip.agg_message_latency_p90';
export const P2P_GOSSIP_AGG_MESSAGE_LATENCY_AVG = 'aztec.p2p.gossip.agg_message_latency_avg';

export const P2P_GOSSIP_AGG_MESSAGE_VALIDATION_DURATION_MIN = 'aztec.p2p.gossip.agg_message_validation_duration_min';
export const P2P_GOSSIP_AGG_MESSAGE_VALIDATION_DURATION_MAX = 'aztec.p2p.gossip.agg_message_validation_duration_max';
export const P2P_GOSSIP_AGG_MESSAGE_VALIDATION_DURATION_P50 = 'aztec.p2p.gossip.agg_message_validation_duration_p50';
export const P2P_GOSSIP_AGG_MESSAGE_VALIDATION_DURATION_P90 = 'aztec.p2p.gossip.agg_message_validation_duration_p90';
export const P2P_GOSSIP_AGG_MESSAGE_VALIDATION_DURATION_AVG = 'aztec.p2p.gossip.agg_message_validation_duration_avg';

export const PUBLIC_PROCESSOR_TX_DURATION = 'aztec.public_processor.tx_duration';
export const PUBLIC_PROCESSOR_TX_COUNT = 'aztec.public_processor.tx_count';
export const PUBLIC_PROCESSOR_TX_PHASE_COUNT = 'aztec.public_processor.tx_phase_count';
export const PUBLIC_PROCESSOR_TX_GAS = 'aztec.public_processor.tx_gas';
export const PUBLIC_PROCESSOR_PHASE_DURATION = 'aztec.public_processor.phase_duration';
export const PUBLIC_PROCESSOR_PHASE_COUNT = 'aztec.public_processor.phase_count';
export const PUBLIC_PROCESSOR_DEPLOY_BYTECODE_SIZE = 'aztec.public_processor.deploy_bytecode_size';
export const PUBLIC_PROCESSOR_TOTAL_GAS = 'aztec.public_processor.total_gas';
export const PUBLIC_PROCESSOR_TOTAL_GAS_HISTOGRAM = 'aztec.public_processor.total_gas_histogram';
export const PUBLIC_PROCESSOR_GAS_RATE = 'aztec.public_processor.gas_rate';
export const PUBLIC_PROCESSOR_TREE_INSERTION = 'aztec.public_processor.tree_insertion';

export const PUBLIC_EXECUTOR_PREFIX = 'aztec.public_executor.';
export const PUBLIC_EXECUTOR_SIMULATION_COUNT = 'aztec.public_executor.simulation_count';
export const PUBLIC_EXECUTOR_SIMULATION_DURATION = 'aztec.public_executor.simulation_duration';
export const PUBLIC_EXECUTOR_SIMULATION_MANA_PER_SECOND = 'aztec.public_executor.simulation_mana_per_second';
export const PUBLIC_EXECUTOR_SIMULATION_MANA_USED = 'aztec.public_executor.simulation_mana_used';
export const PUBLIC_EXECUTOR_SIMULATION_TOTAL_INSTRUCTIONS = 'aztec.public_executor.simulation_total_instructions';
export const PUBLIC_EXECUTOR_TX_HASHING = 'aztec.public_executor.tx_hashing';
export const PUBLIC_EXECUTOR_PRIVATE_EFFECTS_INSERTION = 'aztec.public_executor.private_effects_insertion';
export const PUBLIC_EXECUTOR_SIMULATION_BYTECODE_SIZE = 'aztec.public_executor.simulation_bytecode_size';

export const PROVING_ORCHESTRATOR_BASE_ROLLUP_INPUTS_DURATION =
  'aztec.proving_orchestrator.base_rollup.inputs_duration';

export const PROVING_QUEUE_JOB_SIZE = 'aztec.proving_queue.job_size';
export const PROVING_QUEUE_SIZE = 'aztec.proving_queue.size';
export const PROVING_QUEUE_TOTAL_JOBS = 'aztec.proving_queue.enqueued_jobs_count';
export const PROVING_QUEUE_CACHED_JOBS = 'aztec.proving_queue.cached_jobs_count';
export const PROVING_QUEUE_ACTIVE_JOBS = 'aztec.proving_queue.active_jobs_count';
export const PROVING_QUEUE_RESOLVED_JOBS = 'aztec.proving_queue.resolved_jobs_count';
export const PROVING_QUEUE_REJECTED_JOBS = 'aztec.proving_queue.rejected_jobs_count';
export const PROVING_QUEUE_RETRIED_JOBS = 'aztec.proving_queue.retried_jobs_count';
export const PROVING_QUEUE_TIMED_OUT_JOBS = 'aztec.proving_queue.timed_out_jobs_count';
export const PROVING_QUEUE_JOB_WAIT = 'aztec.proving_queue.job_wait';
export const PROVING_QUEUE_JOB_DURATION = 'aztec.proving_queue.job_duration';
export const PROVING_QUEUE_DB_NUM_ITEMS = 'aztec.proving_queue.db.num_items';
export const PROVING_QUEUE_DB_MAP_SIZE = 'aztec.proving_queue.db.map_size';
export const PROVING_QUEUE_DB_USED_SIZE = 'aztec.proving_queue.db.used_size';

export const PROVING_AGENT_IDLE = 'aztec.proving_queue.agent.idle';

export const PROVER_NODE_EXECUTION_DURATION = 'aztec.prover_node.execution.duration';
export const PROVER_NODE_JOB_DURATION = 'aztec.prover_node.job_duration';
export const PROVER_NODE_JOB_BLOCKS = 'aztec.prover_node.job_blocks';
export const PROVER_NODE_JOB_TRANSACTIONS = 'aztec.prover_node.job_transactions';
export const PROVER_NODE_REWARDS_TOTAL = 'aztec.prover_node.rewards_total';
export const PROVER_NODE_REWARDS_PER_EPOCH = 'aztec.prover_node.rewards_per_epoch';

export const WORLD_STATE_FORK_DURATION = 'aztec.world_state.fork.duration';
export const WORLD_STATE_SYNC_DURATION = 'aztec.world_state.sync.duration';
export const WORLD_STATE_MERKLE_TREE_SIZE = 'aztec.world_state.merkle_tree_size';
export const WORLD_STATE_DB_SIZE = 'aztec.world_state.db_size';
export const WORLD_STATE_DB_MAP_SIZE = 'aztec.world_state.db_map_size';
export const WORLD_STATE_DB_PHYSICAL_SIZE = 'aztec.world_state.db_physical_size';
export const WORLD_STATE_TREE_SIZE = 'aztec.world_state.tree_size';
export const WORLD_STATE_UNFINALISED_HEIGHT = 'aztec.world_state.unfinalised_height';
export const WORLD_STATE_FINALISED_HEIGHT = 'aztec.world_state.finalised_height';
export const WORLD_STATE_OLDEST_BLOCK = 'aztec.world_state.oldest_block';
export const WORLD_STATE_DB_USED_SIZE = 'aztec.world_state.db_used_size';
export const WORLD_STATE_DB_NUM_ITEMS = 'aztec.world_state.db_num_items';
export const WORLD_STATE_REQUEST_TIME = 'aztec.world_state.request_time';
export const WORLD_STATE_CRITICAL_ERROR_COUNT = 'aztec.world_state.critical_error_count';

export const PROOF_VERIFIER_COUNT = 'aztec.proof_verifier.count';

export const VALIDATOR_RE_EXECUTION_TIME = 'aztec.validator.re_execution_time';
export const VALIDATOR_RE_EXECUTION_MANA = 'aztec.validator.re_execution_mana';
export const VALIDATOR_RE_EXECUTION_TX_COUNT = 'aztec.validator.re_execution_tx_count';

export const VALIDATOR_FAILED_REEXECUTION_COUNT = 'aztec.validator.failed_reexecution_count';
export const VALIDATOR_ATTESTATION_COUNT = 'aztec.validator.attestation_count';
export const VALIDATOR_FAILED_ATTESTATION_COUNT = 'aztec.validator.failed_attestation_count';

export const NODEJS_EVENT_LOOP_DELAY_MIN = 'nodejs.eventloop.delay.min';
export const NODEJS_EVENT_LOOP_DELAY_MEAN = 'nodejs.eventloop.delay.mean';
export const NODEJS_EVENT_LOOP_DELAY_MAX = 'nodejs.eventloop.delay.max';
export const NODEJS_EVENT_LOOP_DELAY_STDDEV = 'nodejs.eventloop.delay.stddev';
export const NODEJS_EVENT_LOOP_DELAY_P50 = 'nodejs.eventloop.delay.p50';
export const NODEJS_EVENT_LOOP_DELAY_P90 = 'nodejs.eventloop.delay.p90';
export const NODEJS_EVENT_LOOP_DELAY_P99 = 'nodejs.eventloop.delay.p99';

export const NODEJS_EVENT_LOOP_UTILIZATION = 'nodejs.eventloop.utilization';
export const NODEJS_EVENT_LOOP_TIME = 'nodejs.eventloop.time';

export const NODEJS_MEMORY_HEAP_USAGE = 'nodejs.memory.v8_heap.usage';
export const NODEJS_MEMORY_HEAP_TOTAL = 'nodejs.memory.v8_heap.total';
export const NODEJS_MEMORY_NATIVE_USAGE = 'nodejs.memory.native.usage';
export const NODEJS_MEMORY_BUFFER_USAGE = 'nodejs.memory.array_buffer.usage';

export const TX_COLLECTOR_TXS_FROM_PROPOSALS_COUNT = 'aztec.tx_collector.txs_from_proposal_count';
export const TX_COLLECTOR_TXS_FROM_MEMPOOL_COUNT = 'aztec.tx_collector.txs_from_mempool_count';
export const TX_COLLECTOR_TXS_FROM_P2P_COUNT = 'aztec.tx_collector.txs_from_p2p_count';
export const TX_COLLECTOR_MISSING_TXS_COUNT = 'aztec.tx_collector.missing_txs_count';

export const IVC_VERIFIER_TIME = 'aztec.ivc_verifier.time';
export const IVC_VERIFIER_TOTAL_TIME = 'aztec.ivc_verifier.total_time';
export const IVC_VERIFIER_FAILURE_COUNT = 'aztec.ivc_verifier.failure_count';

export const IVC_VERIFIER_AGG_DURATION_MIN = 'aztec.ivc_verifier.agg_duration_min';
export const IVC_VERIFIER_AGG_DURATION_MAX = 'aztec.ivc_verifier.agg_duration_max';
export const IVC_VERIFIER_AGG_DURATION_P50 = 'aztec.ivc_verifier.agg_duration_p50';
export const IVC_VERIFIER_AGG_DURATION_P90 = 'aztec.ivc_verifier.agg_duration_p90';
export const IVC_VERIFIER_AGG_DURATION_AVG = 'aztec.ivc_verifier.agg_duration_avg';
