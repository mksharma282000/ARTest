import "@google/model-viewer";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Music, Pause, Plus, Minus, Sliders } from "lucide-react";

const instructions = [
  "Use your finger to rotate the model ",
  "Pinch to zoom in and out",
  "Press and drag to move the model ",
];

const Model = ({
  src,
  audioSrc,
  poster,
  alt,
  iosSrc,
  shadowIntensity = 1,
  cameraControls = true,
  autoRotate = false,
  ar = false,
  className = "w-full h-full",
  modelName = "3D Model",
  ...props
}) => {
  const modelViewerRef = useRef(null);
  const audioRef = useRef(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const router = useRouter();
  const [scale, setScale] = useState(0.9);

  useEffect(() => {
    setIsPageLoaded(true);
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      setIsARSupported(modelViewer.canActivateAR);
    }

    if (audioSrc) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0;
    }
  }, [audioSrc]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsAudioPlaying(true))
        .catch((err) => console.error("Audio play failed:", err));
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }
  };

  const activateAR = async () => {
    if (modelViewerRef.current) {
      const arView = await modelViewerRef.current.activateAR();
      if (arView) {
        setIsPageLoaded(true);
        setIsAudioPlaying(true);
      } else {
        console.error("Failed to activate AR");
      }
    }
  };
  // Simplify and update slider handler
  const handleSliderChange = (event) => {
    const newScale = parseFloat(event.target.value);
    setScale(newScale);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Top Bar: Always Visible */}
      <div className="absolute p-2 items-center rounded-2xl justify-between top-5 text-gray-500 w-[90%] flex bg-white border-2 px-4 z-50">
        <button
          onClick={() => router.push("/")}
          className="relative text-xl flex items-center hover:bg-gray-200"
        >
          <span>X</span>
        </button>

        {/* <p className="text-black font-semibold">NAME</p> */}
        <p className="text-black font-semibold">{modelName || "3D Model"}</p>

        {/* App Tour Button */}
        <button
          onClick={() => {
            setIsTourVisible(true);
            setTourStep(0);
          }}
          className="relative px-2 bg-white rounded-full border-2 border-gray-500"
        >
          ?
        </button>
      </div>

      {isPageLoaded ? (
        <>
          <model-viewer
            ref={modelViewerRef}
            src={src}
            ios-src={iosSrc}
            poster={poster}
            alt={alt}
            ar={ar}
            shadow-intensity={shadowIntensity}
            camera-controls={cameraControls}
            auto-rotate={autoRotate}
            className={className}
            scale={`${scale} ${scale} ${scale}`} // Apply scale dynamically
            {...props}
          ></model-viewer>

          {/* Zoom in/out slider */}
          <div className="absolute left-2 z-50 top-[60%] flex flex-col-reverse align-center justify-center">
            <input
              type="range"
              min="0.5" // Allow a smaller size
              max="1" // Maintain a max zoom
              step="0.05"
              value={scale}
              onChange={handleSliderChange}
              className="w-24 h-48"
              style={{ writingMode: "bt-lr", transform: "rotate(270deg)" }}
            />
          </div>

          {/* Scale Adjustment Buttons */}
          {/* <div className="absolute bottom-24 left-4 flex flex-col gap-2">
            <button
              onClick={() => setScale((prev) => Math.min(prev + 0.1, 3))} // Max scale 3
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-200 transition"
            >
              <Plus size={24} />
            </button>
            <button
              onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.3))} // Min scale 0.3
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-200 transition"
            >
              <Minus size={24} />
            </button>
          </div> */}

          {/* App Tour Popup */}
          {isTourVisible && (
            <div className="fixed inset-x-0 bottom-0 p-4 bg-black bg-opacity-50 flex items-end justify-center z-40 h-screen">
              <div className="flex flex-col gap-5 p-2 rounded-lg shadow-xl max-w-sm text-center">
                <div className="bg-gray-900 rounded-2xl px-6 py-4">
                  <p className="text-white font-semibold">
                    {instructions[tourStep]}
                  </p>
                </div>
                <div className="flex justify-center gap-10">
                  {tourStep > 0 ? (
                    <button
                      onClick={() => setTourStep(tourStep - 1)}
                      className="px-4 py-2 rounded-full bg-blue-500 text-white border-2 border-white"
                    >
                      {"<"}
                    </button>
                  ) : (
                    <button className="px-4 py-2 rounded-full bg-gray-500 text-white border-2 border-white">
                      {"<"}
                    </button>
                  )}
                  <button
                    onClick={() => setIsTourVisible(false)}
                    className="px-4 py-2 bg-white text-blue-500 font-semibold border-2 border-blue-500 rounded-full"
                  >
                    EXIT TUTORIAL
                  </button>
                  {tourStep < instructions.length - 1 ? (
                    <button
                      onClick={() => setTourStep(tourStep + 1)}
                      className="px-4 rounded-full py-2 bg-blue-500 text-white border-2 border-white"
                    >
                      {">"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsTourVisible(false);
                        setTourStep(0);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-full border-2 border-white"
                    >
                      {">"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Play / Pause Audio Button */}
          {!isTourVisible && (
            <button
              onClick={isAudioPlaying ? stopAudio : playAudio}
              className="absolute bottom-[15%] right-4 p-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-all"
            >
              {isAudioPlaying ? <Pause size={24} /> : <Music size={24} />}
            </button>
          )}

          {/* SEE IN YOUR ROOM Button */}
          {!isTourVisible && (
            <div className="absolute bottom-[5%] w-full m-auto items-center justify-center flex">
              <button
                className="self-stretch min-w-16 px-2 py-2 bg-Background-Button-Primary-Default rounded-full outline outline-1 outline-offset-[-1px] outline-Stroke-White inline-flex justify-center items-center gap-4 overflow-hidden custom-ar-button bg-blue-500 relative space-x-2 shadow-md hover:bg-blue-700 focus:outline-none w-[90%]"
                onClick={activateAR}
              >
                <img
                  src="./myplace.png"
                  alt="AR Icon"
                  className="w-8 h-8 filter invert"
                />
                <span className="text-white">
                  {isARSupported ? "SEE IN YOUR ROOM" : "SEE IN YOUR ROOM"}
                </span>
              </button>
            </div>
          )}
        </>
      ) : (
        <p>Loading, please wait...</p>
      )}
    </div>
  );
};

export default Model;
