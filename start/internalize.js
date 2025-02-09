function saveToIndexedDB(dataURL, key) {
    const dbName = "TLC";
    const storeName = "data";

    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName); // Ensure store is created
        }
    };

    request.onsuccess = function(event) {
        const db = event.target.result;

        // Wait for any pending upgrade transactions to complete
        if (db.version === 1 && !db.objectStoreNames.contains(storeName)) {
            alert("Object store creation is not finished yet. Try again after a moment.");
            return;
        }

        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        store.put(dataURL, key);

        transaction.oncomplete = function () {
            alert("Image saved to IndexedDB as 'warped'");
        };

        transaction.onerror = function () {
            alert("Error saving image to IndexedDB.");
        };
    };

    request.onerror = function() {
        alert("Error opening IndexedDB.");
    };
}

async function getImageUrlFromIndexedDB(dbName, storeName, key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            // Sprawdź, czy store został poprawnie utworzony
            if (!db.objectStoreNames.contains(storeName)) {
                return reject("Object store not found after upgrade.");
            }

            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(key);

            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => reject("Failed to retrieve image URL.");
        };

        request.onerror = () => reject("Failed to open IndexedDB.");
    });
}
