/// Minimal string module shim
module std::string {
    struct String has copy, drop, store {
        bytes: vector<u8>,
    }

    public fun utf8(bytes: vector<u8>): String {
        String { bytes }
    }

    public fun bytes(s: &String): &vector<u8> {
        &s.bytes
    }

    public fun length(s: &String): u64 {
        std::vector::length(&s.bytes)
    }

    public fun is_empty(s: &String): bool {
        std::vector::is_empty(&s.bytes)
    }
}
