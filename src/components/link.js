const saveToIndexedDB = async (modelName, fileBlob) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ModelStorageDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("models")) {
        db.createObjectStore("models", { keyPath: "name" });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("models", "readwrite");
      const store = transaction.objectStore("models");
      store.put({ name: modelName, data: fileBlob });

      transaction.oncomplete = () => {
        console.log("Model saved to IndexedDB:", modelName);
        resolve(true);
      };

      transaction.onerror = (error) => reject(error);
    };

    request.onerror = (error) => reject(error);
  });
};

const downloadFile = async (object) => {
  const validFiles = Object.entries(object.file_name).filter(
    ([_, fileName]) => fileName.length > 0
  );

  if (validFiles.length === 0) {
    console.log("No valid files to download.");
    return;
  }

  try {
    const downloadPromises = validFiles.map(async ([key, fileNames]) => {
      console.log(`Downloading ${key}:`, fileNames);
      const presignedUrlResponse = await fetch(
        `https://e60tr3t3xe.execute-api.ap-south-1.amazonaws.com/dev/?object_name=${object.object_name}&file_name=${fileNames[0]}`
      );

      if (!presignedUrlResponse.ok) {
        throw new Error(
          `Failed to get pre-signed URL: ${presignedUrlResponse.statusText}`
        );
      }

      const { presignedUrl } = await presignedUrlResponse.json();
      console.log(`Pre-signed URL received for ${key}`, presignedUrl);

      const fileResponse = await fetch(presignedUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }

      const blob = await fileResponse.blob();
      if (blob.size === 0) {
        console.warn(`Empty blob received for ${key}, skipping save.`);
        return;
      }

      return saveToIndexedDB(key, blob);
    });

    const markerPromise = (async () => {
      const markerfile = `markers/${object.marker}`;
      console.log("Downloading marker:", object.marker);

      const markerResponse = await fetch(
        `https://e60tr3t3xe.execute-api.ap-south-1.amazonaws.com/dev/?object_name=${object.object_name}&file_name=${markerfile}`
      );

      if (!markerResponse.ok) {
        throw new Error(`Failed to get marker: ${markerResponse.statusText}`);
      }

      const { presignedUrl } = await markerResponse.json();
      console.log("Pre-signed URL received for marker", presignedUrl);

      const markerFileResponse = await fetch(presignedUrl);
      if (!markerFileResponse.ok) {
        throw new Error(
          `Failed to fetch marker: ${markerFileResponse.statusText}`
        );
      }

      const markerBlob = await markerFileResponse.blob();
      return saveToIndexedDB("marker", markerBlob);
    })();

    await Promise.all([...downloadPromises, markerPromise]);

    const keys = await getAllSavedKeys();
    console.log("All saved keys:", keys);
    localStorage.setItem("indexedDBKeys", JSON.stringify(keys));
    sessionStorage.setItem("indexedDBKeys", JSON.stringify(keys));

    console.log("All valid files downloaded and saved successfully!");
  } catch (error) {
    console.error("Error downloading files:", error);
  }
};

const getAllSavedKeys = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ModelStorageDB", 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("models", "readonly");
      const store = transaction.objectStore("models");
      const keysRequest = store.getAllKeys();

      keysRequest.onsuccess = () => {
        console.log("Saved Keys:", keysRequest.result);
        resolve(keysRequest.result);
      };

      keysRequest.onerror = () =>
        reject("Failed to retrieve keys from IndexedDB");
    };

    request.onerror = () => reject("Failed to open IndexedDB");
  });
};
const getModels = async () => {
  try {
    const response = await fetch(
      `https://e60tr3t3xe.execute-api.ap-south-1.amazonaws.com/dev/models`,
      {
        method: "GET",
        body: null,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to complete upload: ${response.statusText}`);
    }

    console.log("Upload completed successfully!");
    console.log(response);
    return response.json();
  } catch (error) {
    console.error("Error in completeUpload:", error);
    throw error;
  }
};
export { downloadFile, getModels };
