// A contract used along with `StaticChild` contract to test static calls.
use dep::aztec::macros::aztec;

#[aztec]
pub contract StaticParent {
    use dep::aztec::{context::gas::GasOpts, macros::functions::{private, public, view}};
    use dep::aztec::protocol_types::{
        abis::function_selector::FunctionSelector, address::AztecAddress,
    };
    use dep::static_child_contract::StaticChild;

    // Public function to directly call another public function to the target_contract using the selector and value provided
    #[public]
    fn public_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        arg: Field,
    ) -> Field {
        context.call_public_function(
            target_contract,
            target_selector,
            [arg].as_slice(),
            GasOpts::default(),
        )[0]
    }

    // Private function to directly call another private function to the target_contract using the selector and args provided
    #[private]
    fn private_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 2],
    ) -> Field {
        context.call_private_function(target_contract, target_selector, args).get_preimage()
    }

    // Just like function above but with 3 args.
    #[private]
    fn private_call_3_args(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 3],
    ) -> Field {
        context.call_private_function(target_contract, target_selector, args).get_preimage()
    }

    // Private function to enqueue a call to a public function of another contract, passing the target arguments provided
    #[private]
    fn enqueue_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 1],
    ) {
        context.call_public_function(target_contract, target_selector, args);
    }

    #[private]
    fn private_static_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 2],
    ) -> Field {
        context.static_call_private_function(target_contract, target_selector, args).get_preimage()
    }

    // Private function to statically call another private function to the target_contract using the selector and values provided
    #[private]
    fn private_static_call_3_args(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 3],
    ) -> Field {
        context.static_call_private_function(target_contract, target_selector, args).get_preimage()
    }

    // Same as above but using a specific function from the interface
    #[private]
    fn private_get_value_from_child(
        target_contract: AztecAddress,
        value: Field,
        owner: AztecAddress,
    ) -> Field {
        StaticChild::at(target_contract).private_get_value(value, owner).view(&mut context)
    }

    // Private function to set a static context and verify correct propagation for nested private calls
    #[private]
    fn private_nested_static_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 2],
    ) -> Field {
        StaticParent::at(context.this_address())
            .private_call(target_contract, target_selector, args)
            .view(&mut context)
    }

    // Just like function above but with 3 args.
    #[private]
    fn private_nested_static_call_3_args(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 3],
    ) -> Field {
        StaticParent::at(context.this_address())
            .private_call_3_args(target_contract, target_selector, args)
            .view(&mut context)
    }

    // Public function to statically call another public function to the target_contract using the selector and value provided
    #[public]
    fn public_static_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 1],
    ) -> Field {
        context.static_call_public_function(
            target_contract,
            target_selector,
            args.as_slice(),
            GasOpts::default(),
        )[0]
    }

    // Same as above but using a specific function from the interface
    #[public]
    fn public_get_value_from_child(target_contract: AztecAddress, value: Field) -> Field {
        StaticChild::at(target_contract).pub_get_value(value).view(&mut context)
    }

    // Public function to set a static context and verify correct propagation for nested public calls
    #[public]
    fn public_nested_static_call(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 1],
    ) -> Field {
        // Call the target public function through the pub entrypoint statically
        StaticParent::at(context.this_address())
            .public_call(target_contract, target_selector, args[0])
            .view(&mut context)
    }

    // Private function to enqueue a static call to a public function of another contract, passing the target arguments provided
    #[private]
    fn enqueue_static_call_to_pub_function(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 1],
    ) {
        context.static_call_public_function(target_contract, target_selector, args);
    }

    // Same as above but using a specific function from the interface
    #[private]
    fn enqueue_public_get_value_from_child(target_contract: AztecAddress, value: Field) {
        StaticChild::at(target_contract).pub_get_value(value).enqueue_view(&mut context);
    }

    // Private function to set a static context and verify correct propagation of nested enqueuing of public calls
    #[private]
    fn enqueue_static_nested_call_to_pub_function(
        target_contract: AztecAddress,
        target_selector: FunctionSelector,
        args: [Field; 1],
    ) {
        // Call the target public function through the pub entrypoint statically
        StaticParent::at(context.this_address())
            .public_call(target_contract, target_selector, args[0])
            .enqueue_view(&mut context)
    }
}
