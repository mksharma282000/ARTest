"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";

const Model = dynamic(
  () => import("../../components/model"),

  { ssr: false }
);

export default function Home() {
  const [source, setSource] = useState("");
  const [iosSource, setIosSource] = useState("");
  const [modellist, setModellist] = useState([]);
  const [finalObject, setFinalObject] = useState({});
  const [isload, loadModel] = useState(false);
  const [word, setWord] = useState("");

  const getModels = useCallback(async () => {
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
  }, []);

  const loadFiles = useCallback(
    (object_name) => {
      const foundObject = modellist.find(
        (object) => object.object_name.toLowerCase() === object_name
      );
      setFinalObject(foundObject);
      console.log(finalObject);
    },
    [modellist, finalObject]
  );

  const downloadFile = async (object_name, fileNames) => {
    console.log(`Object:${object_name} file:${fileNames}`);
    const presignedUrlResponse = await fetch(
      `https://e60tr3t3xe.execute-api.ap-south-1.amazonaws.com/dev/?object_name=${object_name}&file_name=${fileNames}`
    );

    if (!presignedUrlResponse.ok) {
      throw new Error(
        `Failed to get pre-signed URL: ${presignedUrlResponse.statusText}`
      );
    }

    const { presignedUrl } = await presignedUrlResponse.json();
    console.log(`Pre-signed URL received for ${object_name}`, presignedUrl);
    return presignedUrl;
  };

  const viewWord = useCallback(async () => {
    const getWord = window.sessionStorage.getItem("word");
    setWord(getWord);
    console.log(word);
    const list = await getModels();
    setModellist(list);
    console.log(list);
  }, [getModels, word, setWord, setModellist]);

  useEffect(() => {
    if (typeof text === "string" && text.trim() !== "") return;
    viewWord();
  }, [word, viewWord]);

  useEffect(() => {
    if (modellist.length > 0) {
      console.log("The files are", modellist);
      loadFiles(word);
    } else {
    }
  }, [isload, modellist, word, loadFiles]);
  useEffect(() => {
    if (Object.keys(finalObject).length === 0) return;

    console.log("The finalObject: ", finalObject);
    const processFiles = async () => {
      finalObject.file_name.model.forEach(async (files) => {
        if (files.endsWith(".glb")) {
          console.log(files);
          const android = await downloadFile(finalObject.object_name, files);
          setSource(android);
        } else if (files.endsWith(".usdz")) {
          const ios = await downloadFile(object_name, files);
          setIosSource(ios);
        } else {
          console.log("otherFiles");
        }
        loadModel(true);
      });
    };
    processFiles();
  }, [finalObject, source, iosSource]);
  // else {
  //   console.log("loading")
  // }
  // if (modellist.length > 0) {
  //   loadFiles(word);
  // }
  // else {
  //   console.log("list")

  // }
  return (
    <div className="relative flex flex-col justify-center items-center h-screen overflow-hidden bg-red-300">
      <>
        {isload ? (
          <Model
            iosSrc={iosSource}
            src={source}
            poster="https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20431b%2Fposter-astronaut.png?v=1599079951717"
            alt="A 3D model of an astronaut"
            shadowIntensity={1.5}
            autoRotate={true}
            ar={true}
            className="w-screen h-screen mx-auto"
          />
        ) : (
          <p> the page is loading</p>
        )}
      </>
      <p className={isload ? "hidden" : "block"}>{word}</p>
    </div>
  );
}
