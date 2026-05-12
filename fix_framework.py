import os
import re

def sanitize_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
        sanitized = bytes([b for b in content if b < 128])
        with open(filepath, 'wb') as f:
            f.write(sanitized)
    except Exception as e:
        print(f"Error sanitizing {filepath}: {e}")

def replace_in_file(filepath, pattern, replacement):
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"  Patched: {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Error patching {filepath}: {e}")

def fix_framework(base_path):
    print(f"\nFixing: {base_path}")

    # 1. Sanitize all .move files (remove non-ASCII)
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith(".move"):
                sanitize_file(os.path.join(root, file))
    print("  Sanitized all .move files")

    # 2. Fix pool_u64_unbound.move: remove type params from destroy_empty
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "pool_u64_unbound.move":
                replace_in_file(
                    os.path.join(root, file),
                    r"shares\.destroy_empty<[^>]*>\(\);",
                    "shares.destroy_empty();"
                )

    # 3. Fix fungible_asset.move: remove type params from convert
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "fungible_asset.move":
                replace_in_file(
                    os.path.join(root, file),
                    r"token_object\.convert<[^>]*>\(\);",
                    "token_object.convert();"
                )

    # 4. Fix simple_map.move: remove type params from upsert
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "simple_map.move":
                replace_in_file(
                    os.path.join(root, file),
                    r"map\.upsert<[^>]*>\(",
                    "map.upsert("
                )

    # 5. Fix storage_slot.move
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "storage_slot.move":
                filepath = os.path.join(root, file)
                replace_in_file(filepath, r"\.borrow_storage_slot_resource<[^>]*>\(\)", ".borrow_storage_slot_resource()")
                replace_in_file(filepath, r"\.borrow_storage_slot_resource_mut<[^>]*>\(\)", ".borrow_storage_slot_resource_mut()")

    # 6. Fix 'has drop' after lambda type annotations (the "|...|" pattern)
    # Handles: |&mut V| has drop  and  ||V has drop
    lambda_has_drop = r"(\|[^|]*\|[^,)\n]*?)\s+has\s+drop"
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith(".move"):
                filepath = os.path.join(root, file)
                replace_in_file(filepath, lambda_has_drop, r"\1")

    print(f"  Done fixing {base_path}")


move_cache = "/home/oyeolorun/.move"

# Fix all cached framework versions
for entry in os.listdir(move_cache):
    if "aptos-framework" in entry:
        fix_framework(os.path.join(move_cache, entry))

print("\nAll framework caches fixed!")
