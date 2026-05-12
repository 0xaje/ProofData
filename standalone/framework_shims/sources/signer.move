/// Minimal signer module shim
module std::signer {
    native public fun address_of(s: &signer): address;
    native public fun borrow_address(s: &signer): &address;
}
