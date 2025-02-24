"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { downloadFile, getModels } from "@/components/link";

const Model = dynamic(() => import("../../components/model"), { ssr: false });

export default function Home() {
  const [modelName, setModelName] = useState("");
  const [isLoad, setLoadModel] = useState(false);
  const [modelSrc, setModelSrc] = useState(null);

  useEffect(() => {
    const fetchModelName = async () => {
      const storedModel = await window.sessionStorage.getItem("word");
      setModelName(storedModel);
      if (storedModel) {
        searchModel(storedModel); // Search for the model when found
      }
    };
    fetchModelName();
  }, []);

  const searchModel = async (fileName) => {
    try {
      const models = await getModels(); // Fetch models from database
      models.forEach(async (object) => {
        if (object.includes(fileName)) {
          const fileUrl = await downloadFile(fileName); // Get model URL
          setModelSrc(fileUrl);
          setLoadModel(true);
        } else {
          console.error("Model not found in database");
        }
      });
    } catch (error) {
      console.error("Error fetching model:", error);
    }

    return (
      <div className="relative flex flex-col justify-center items-center h-screen overflow-hidden bg-red-300">
        {isLoad && modelSrc ? (
          <Model
            src={modelSrc}
            alt="A 3D model"
            shadowIntensity={1.5}
            autoRotate={true}
            ar={true}
            camera-controls={true}
            touch-action="pan-y"
            className="w-screen h-screen mx-auto"
          />
        ) : (
          <p>The page is loading...</p>
        )}
        <p className={isLoad ? "hidden" : "block"}>{modelName}</p>
      </div>
    );
  };
}
