import "@google/model-viewer";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

const Model = ({
  src,
  poster,
  alt,
  iosSrc,
  shadowIntensity = 1,
  cameraControls = true,
  autoRotate = false,
  ar = false,
  className = "w-full h-full",
  ...props
}) => {
  const modelViewerRef = useRef(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  useEffect(() => {
    setIsPageLoaded(true);
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      setIsARSupported(modelViewer.canActivateAR);
    }
  }, []);
  const activateAR = async () => {
    if (modelViewerRef.current) {
      const arView = await modelViewerRef.current.activateAR();
      if (arView) {
        console.log("AR View activated");
        setIsPageLoaded(true);
      } else {
        console.error("Failed to activate AR");
      }
    }
  };
  // useEffect(() => {

  //   activateAR()
  // })

  return (
    <div className="relative flex flex-col items-center">
      {isPageLoaded ? (
        <>
          <model-viewer
            ref={modelViewerRef}
            src={src}
            ios-src={iosSrc}
            poster={poster}
            alt={alt}
            ar={true}
            ar-mode
            shadow-intensity={shadowIntensity}
            camera-controls={cameraControls}
            auto-rotate={autoRotate}
            className={className}
            {...props}
          ></model-viewer>
          <button
            className="custom-ar-button bg-blue-500 px-4 py-2 rounded-xl absolute bottom-[20%] flex items-center space-x-2 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all"
            onClick={activateAR}
          >
            <img
              src="./myplace.png"
              alt="AR Icon"
              className="w-8 h-8  filter invert "
            />
            <span className="text-white">
              {isARSupported ? "See in my World" : "See in my World"}
            </span>
          </button>
        </>
      ) : (
        <p>Loading, please wait...</p>
      )}
    </div>
  );
};

export default Model;
