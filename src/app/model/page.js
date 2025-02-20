"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const Model = dynamic(
  () => import("../../components/model"),

  { ssr: false }
);

export default function Home() {
  const [modelName, getmodelName] = useState("");
  const [isload, loadModel] = useState(false);

  useEffect(() => {
    const word = async () => {
      const model = await window.sessionStorage.getItem("word");

      getmodelName(model);

      loadModel(true);
    };
    word();
  });
  return (
    <div className="relative flex flex-col justify-center items-center h-screen overflow-hidden bg-red-300">
      <>
        {isload ? (
          <Model
            iosSrc={`/${modelName}/3d.usdz`}
            src={`/${modelName}/3d.glb`}
            // poster="https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20431b%2Fposter-astronaut.png?v=1599079951717"
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
      <p className={isload ? "hidden" : "block"}>{modelName}</p>
    </div>
  );
}
