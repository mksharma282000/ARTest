"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const Model = dynamic(() => import("../../components/model"), { ssr: false });

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
        `https://e60tr3t3xe.execute-api.ap-south-1.amazonaws.com/dev/models`
      );
      if (!response.ok) {
        throw new Error(`Failed to complete upload: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error("Error in getModels:", error);
      throw error;
    }
  }, []);

  const loadFiles = useCallback(
    (object_name) => {
      const foundObject = modellist.find(
        (object) => object.object_name.toLowerCase() === object_name
      );
      setFinalObject(foundObject);
    },
    [modellist]
  );

  const downloadFile = async (object_name, fileNames) => {
    const presignedUrlResponse = await fetch(
      `https://e60tr3t3xe.execute-api.ap-south-1.amazonaws.com/dev/?object_name=${object_name}&file_name=${fileNames}`
    );
    if (!presignedUrlResponse.ok) {
      throw new Error(
        `Failed to get pre-signed URL: ${presignedUrlResponse.statusText}`
      );
    }
    const { presignedUrl } = await presignedUrlResponse.json();
    return presignedUrl;
  };

  const viewWord = useCallback(async () => {
    const getWord = window.sessionStorage.getItem("word");
    setWord(getWord);
    const list = await getModels();
    setModellist(list);
  }, [getModels]);

  useEffect(() => {
    if (word.trim() === "") viewWord();
  }, [word, viewWord]);

  useEffect(() => {
    if (modellist.length > 0) loadFiles(word);
  }, [modellist, word, loadFiles]);

  useEffect(() => {
    if (Object.keys(finalObject).length === 0) return;

    const processFiles = async () => {
      finalObject.file_name.model.forEach(async (files) => {
        if (files.endsWith(".glb")) {
          const android = await downloadFile(finalObject.object_name, files);
          setSource(android);
        } else if (files.endsWith(".usdz")) {
          const ios = await downloadFile(finalObject.object_name, files);
          setIosSource(ios);
        }
        loadModel(true);
      });
    };
    processFiles();
  }, [finalObject]);

  return (
    <div className="relative flex flex-col justify-center items-center h-screen overflow-hidden bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500">
      {isload ? (
        <Model
          iosSrc={iosSource}
          src={source}
          // poster="https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20431b%2Fposter-astronaut.png?v=1599079951717"
          alt="A 3D model of an astronaut"
          shadowIntensity={1.5}
          autoRotate={true}
          ar={true}
          className="w-screen h-screen mx-auto"
        />
      ) : (
        <div className="flex flex-col items-center">
          {/* Animated Loading Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin"
          />

          {/* Typing Effect Message */}
          <motion.p
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 10 }}
            className="text-white text-lg mt-4 font-semibold"
          >
            🚀 Loading your 3D experience...
          </motion.p>
        </div>
      )}
      <p className={isload ? "hidden" : "block text-white text-xl mt-4"}>{word}</p>
    </div>
  );
}
