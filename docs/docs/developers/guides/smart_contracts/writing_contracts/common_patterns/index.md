---
title: Common Patterns
sidebar_position: 7
---

There are many common patterns have been devised by the Aztec core engineering team and the work of the external community as we build Aztec.nr contracts internally (see some of them [here (GitHub link)](https://github.com/AztecProtocol/aztec-packages/tree/master/noir-projects/noir-contracts)).

This doc aims to summarize some of them!

Similarly we have discovered some anti-patterns too (like privacy leakage) that we will point out here!

## Common Patterns

### Approving another user/contract to execute an action on your behalf

We call this the "authentication witness" pattern or authwit for short.

- Approve someone in private domain:
  #include_code authwit_to_another_sc /yarn-project/end-to-end/src/e2e_cross_chain_messaging/token_bridge_private.test.ts typescript

Here you approve a contract to burn funds on your behalf.

- Approve in public domain:
  #include_code authwit_public_transfer_example /yarn-project/end-to-end/src/e2e_token_contract/transfer_in_public.test.ts typescript

Here you approve someone to transfer funds publicly on your behalf

### Prevent the same user flow from happening twice using nullifiers

E.g. you don't want a user to subscribe once they have subscribed already. Or you don't want them to vote twice once they have done that. How do you prevent this?

Emit a nullifier in your function. By adding this nullifier into the tree, you prevent another nullifier from being added again. This is also why in authwit, we emit a nullifier, to prevent someone from reusing their approval.

#include_code verify_private_authwit /noir-projects/aztec-nr/aztec/src/authwit/account.nr rust

Note be careful to ensure that the nullifier is not deterministic and that no one could do a preimage analysis attack. More in [the anti pattern section on deterministic nullifiers](#deterministic-nullifiers)

Note - you could also create a note and send it to the user. The problem is there is nothing stopping the user from not presenting this note when they next interact with the function.

### Reading public storage in private

You can read public storage in private domain by leveraging the private getters of `PublicImmutable` (for values that never change) and `SharedMutable` (for values that change infrequently, see [shared state](../../../../reference/smart_contract_reference/storage/shared_state.md) for details) state variables.
Values that change frequently (`PublicMutable`) cannot be read in private as for those we need access to the tip of the chain and only a sequencer has access to that (and sequencer executes only public functions).

E.g. when using `PublicImmutable`

```rust
#[storage]
struct Storage {
  config: PublicImmutable<Config, Context>,
}

contract Bridge {

    #[private]
    fn burn_token_private(
        token: AztecAddress, // pass token here since this is a private method but can't access public storage
        amount: Field,
    ) -> Field {
        ...
    #include_code assert_token_is_same /noir-projects/noir-contracts/contracts/app/token_bridge_contract/src/main.nr raw
    }
}
```

:::danger
This leaks information about the private function being called and the data which has been read.
:::

### Writing public storage from private

When calling a private function, you can update public state by calling a public function.

In this situation, try to mark the public function as `internal`. This ensures your flow works as intended and that no one can call the public function without going through the private function first!

### Moving public data into the private domain

See [partial notes](../../../../../aztec/concepts/advanced/storage/partial_notes.md). Partial notes are how public balances are transferred to private [in the NFT contract](../../../../tutorials/codealong/contract_tutorials/nft_contract.md).

### Discovering my notes

When you send someone a note, the note hash gets added to the note hash tree. To spend the note, the receiver needs to get the note itself (the note hash preimage). There are two ways you can get a hold of your notes:

1. When sending someone a note, emit the note log to the recipient (the function encrypts the log in such a way that only a recipient can decrypt it). PXE then tries to decrypt all the encrypted logs, and stores the successfully decrypted one. [More info here](../how_to_emit_event.md)
2. Manually delivering it via a custom contract method, if you choose to not emit logs to save gas or when creating a note in the public domain and want to consume it in private domain (`encrypt_and_emit_note` shouldn't be called in the public domain because everything is public), like in the previous section where we created a note in public that doesn't have a designated owner.

#include_code offchain_delivery yarn-project/end-to-end/src/composed/e2e_persistence.test.ts typescript

Note that this requires your contract to have a utility function that processes these notes and adds them to PXE.

#include_code deliver_note_contract_method noir-projects/noir-contracts/contracts/app/token_blacklist_contract/src/main.nr rust

### Revealing encrypted logs conditionally

An encrypted log can contain any information for a recipient, typically in the form of a note. One could think this log is emitted as part of the transaction execution, so it wouldn't be revealed if the transaction fails.

This is not true for Aztec, as the encrypted log is part of the transaction object broadcasted to the network. So if a transaction with an encrypted log and a note commitment is broadcasted, there could be a situation where the transaction is not mined or reorg'd out, so the commitment is never added to the note hash tree, but the recipient could still have read the encrypted log from the transaction in the mempool.

Example:

> Alice and Bob agree to a trade, where Alice sends Bob a passcode to collect funds from a web2 app, in exchange of on-chain tokens. Alice should only send Bob the passcode if the trade is successful. But just sending the passcode as an encrypted log doesn't work, since Bob could see the encrypted log from the transaction as soon as Alice broadcasts it, decrypt it to get the passcode, and withdraw his tokens from the trade to make the transaction fail.

### Randomness in notes

Notes are hashed and stored in the merkle tree. While notes do have a header with a `nonce` field that ensure two exact notes still can be added to the note hash tree (since hashes would be different), preimage analysis can be done to reverse-engineer the contents of the note.

Hence, it's necessary to add a "randomness" field to your note to prevent such attacks.

#include_code address_note_def noir-projects/aztec-nr/address-note/src/address_note.nr rust

### L1 -- L2 interactions

Refer to [Token Portal codealong tutorial on bridging tokens between L1 and L2](../../../../tutorials/codealong/js_tutorials/token_bridge.md) and/or [Uniswap smart contract example that shows how to swap on L1 using funds on L2](../../../../tutorials/codealong/js_tutorials/uniswap/index.md). Both examples show how to:

1. L1 -> L2 message flow
2. L2 -> L1 message flow
3. Cancelling messages from L1 -> L2.
4. For both L1->L2 and L2->L1, how to operate in the private and public domain

### Sending notes to a contract/Escrowing notes between several parties in a contract

To send a note to someone, they need to have a key which we can encrypt the note with. But often contracts may not have a key. And even if they do, how does it make use of it autonomously?

There are several patterns here:

1. Give the contract a key and share it amongst all participants. This leaks privacy, as anyone can see all the notes in the contract.
2. `transfer_to_public` funds into the contract - this is used in the [Uniswap smart contract example where a user sends private funds into a Uniswap Portal contract which eventually withdraws to L1 to swap on L1 Uniswap](../../../../tutorials/codealong/js_tutorials/uniswap/index.md). This works like Ethereum - to achieve contract composability, you move funds into the public domain. This way the contract doesn't even need keys.

There are several other designs we are discussing through [in this discourse post](https://discourse.aztec.network/t/how-to-handle-private-escrows-between-two-parties/2440) but they need some changes in the protocol or in our demo contract. If you are interested in this discussion, please participate in the discourse post!

### Share Private Notes

If you have private state that needs to be handled by more than a single user (but no more than a handful), you can add the note commitment to the note hash tree, and then encrypt the note once for each of the users that need to see it. And if any of those users should be able to consume the note, you can generate a random nullifier on creation and store it in the encrypted note, instead of relying on the user secret.

## Anti Patterns

There are mistakes one can make to reduce their privacy set and therefore make it trivial to do analysis and link addresses. Some of them are:

### Passing along your address when calling a public function from private

If you have a private function which calls a public function, remember that sequencer can see any parameters passed to the public function. So try to not pass any parameter that might leak privacy (e.g. `from` address)

PS: when calling from private to public, `msg_sender` is the contract address which is calling the public function.

### Deterministic nullifiers

In the [Prevent the same user flow from happening twice using nullifier](#prevent-the-same-user-flow-from-happening-twice-using-nullifiers), we recommended using nullifiers. But what you put in the nullifier is also as important.

E.g. for a voting contract, if your nullifier simply emits just the `user_address`, then privacy can easily be leaked via a preimage attack as nullifiers are deterministic (have no randomness), especially if there are few users of the contract. So you need some kind of randomness. You can add the user's secret key into the nullifier to add randomness. We call this "nullifier secrets" as explained [here](../../../../../aztec/concepts/accounts/keys.md#nullifier-keys).

Here is an example from the voting contract:

#include_code cast_vote /noir-projects/noir-contracts/contracts/app/easy_private_voting_contract/src/main.nr rust
