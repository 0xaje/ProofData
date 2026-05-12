/// Minimal vector module shim
module std::vector {
    native public fun empty<T>(): vector<T>;
    native public fun length<T>(v: &vector<T>): u64;
    native public fun borrow<T>(v: &vector<T>, i: u64): &T;
    native public fun push_back<T>(v: &mut vector<T>, e: T);
    native public fun borrow_mut<T>(v: &mut vector<T>, i: u64): &mut T;
    native public fun pop_back<T>(v: &mut vector<T>): T;
    native public fun destroy_empty<T>(v: vector<T>);
    native public fun swap<T>(v: &mut vector<T>, i: u64, j: u64);

    public fun is_empty<T>(v: &vector<T>): bool {
        length(v) == 0
    }
}
