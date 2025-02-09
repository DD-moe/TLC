function saveToIndexedDB(dataURL) {
    const dbName = "TLC";
    const storeName = "data";
    const key = "warped";

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