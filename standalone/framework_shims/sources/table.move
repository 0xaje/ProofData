/// Minimal table shim using native operations
module aptos_std::table {
    struct Table<phantom K: copy + drop, phantom V> has store {
        handle: address,
    }

    native public fun new<K: copy + drop, V: store>(): Table<K, V>;
    native public fun add<K: copy + drop, V>(table: &mut Table<K, V>, key: K, val: V);
    native public fun borrow<K: copy + drop, V>(table: &Table<K, V>, key: K): &V;
    native public fun borrow_mut<K: copy + drop, V>(table: &mut Table<K, V>, key: K): &mut V;
    native public fun remove<K: copy + drop, V>(table: &mut Table<K, V>, key: K): V;
    native public fun contains<K: copy + drop, V>(table: &Table<K, V>, key: K): bool;
    native public fun destroy_empty<K: copy + drop, V>(table: Table<K, V>);
}
