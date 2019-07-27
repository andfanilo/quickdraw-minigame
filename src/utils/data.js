import {
    openDB,
    deleteDB
} from "idb";

class PhotosDAO {
    constructor(db_name, store_name) {
        this.db_name = db_name;
        this.store_name = store_name;

        openDB(db_name, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(store_name)) {
                    db.createObjectStore(store_name, {
                        autoIncrement: true
                    });
                }
            }
        }).then(db => this.db = db)
    }

    add_photo(img, label) {
        return this.db.add(this.store_name, {
            label: label,
            img: img
        })
    }

    get_range_photos(low, high) {
        return this.db.getAll(this.store_name, IDBKeyRange.bound(low, high))
    }

    get_all_photos() {
        return this.db.getAll(this.store_name)
    }

    count_photos() {
        return this.db.count(this.store_name);
    }

    remove_all_items() {
        return this.db.clear(this.store_name);
    }

    async drop_database() {
        await deleteDB(this.db_name)
    }
}

export {
    PhotosDAO
};