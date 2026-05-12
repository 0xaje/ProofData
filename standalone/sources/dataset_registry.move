module ProofData::dataset_registry {
    use std::string::String;
    use std::signer;
    use aptos_std::table::{Self, Table};

    struct Dataset has store, drop {
        id: String,
        owner: address,
        storage_pointer: String,
        hash: vector<u8>,
        price_per_read: u64,
        version: u64,
    }

    struct Registry has key {
        datasets: Table<String, Dataset>,
    }

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_DATASET_NOT_FOUND: u64 = 3;
    const E_INSUFFICIENT_PAYMENT: u64 = 4;
    const E_DATASET_ALREADY_EXISTS: u64 = 5;
    const E_NOT_AUTHORIZED: u64 = 6;

    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(addr == @ProofData, E_NOT_AUTHORIZED);
        assert!(!exists<Registry>(addr), E_ALREADY_INITIALIZED);

        move_to(account, Registry {
            datasets: table::new(),
        });
    }

    public entry fun register_dataset(
        account: &signer,
        id: String,
        storage_pointer: String,
        hash: vector<u8>,
        price_per_read: u64
    ) acquires Registry {
        assert!(exists<Registry>(@ProofData), E_NOT_INITIALIZED);

        let owner = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@ProofData);

        assert!(!table::contains(&registry.datasets, id), E_DATASET_ALREADY_EXISTS);

        table::add(&mut registry.datasets, id, Dataset {
            id,
            owner,
            storage_pointer,
            hash,
            price_per_read,
            version: 1,
        });
    }

    public entry fun update_dataset_version(
        account: &signer,
        id: String,
        new_storage_pointer: String,
        new_hash: vector<u8>
    ) acquires Registry {
        assert!(exists<Registry>(@ProofData), E_NOT_INITIALIZED);
        let registry = borrow_global_mut<Registry>(@ProofData);
        assert!(table::contains(&registry.datasets, id), E_DATASET_NOT_FOUND);

        let dataset = table::borrow_mut(&mut registry.datasets, id);
        assert!(dataset.owner == signer::address_of(account), E_NOT_AUTHORIZED);

        dataset.storage_pointer = new_storage_pointer;
        dataset.hash = new_hash;
        dataset.version = dataset.version + 1;
    }

    public entry fun pay_and_access(
        buyer: &signer,
        dataset_id: String
    ) acquires Registry {
        assert!(exists<Registry>(@ProofData), E_NOT_INITIALIZED);

        let registry = borrow_global_mut<Registry>(@ProofData);
        assert!(table::contains(&registry.datasets, dataset_id), E_DATASET_NOT_FOUND);

        // Payment handled on-chain via coin::transfer called externally
        let _ = signer::address_of(buyer);
    }

    #[view]
    public fun get_dataset_info(dataset_id: String): (address, String, vector<u8>, u64, u64) acquires Registry {
        assert!(exists<Registry>(@ProofData), E_NOT_INITIALIZED);
        let registry = borrow_global<Registry>(@ProofData);
        assert!(table::contains(&registry.datasets, dataset_id), E_DATASET_NOT_FOUND);

        let dataset = table::borrow(&registry.datasets, dataset_id);
        (dataset.owner, dataset.storage_pointer, dataset.hash, dataset.price_per_read, dataset.version)
    }

    #[view]
    public fun dataset_exists(dataset_id: String): bool acquires Registry {
        if (!exists<Registry>(@ProofData)) { return false };
        let registry = borrow_global<Registry>(@ProofData);
        table::contains(&registry.datasets, dataset_id)
    }
}
