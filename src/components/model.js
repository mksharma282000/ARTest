import "@google/model-viewer";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Music, Pause } from "lucide-react";

const instructions = [
  "Welcome to the 3D Model Viewer! Click 'Next' to continue.",
  "You can rotate and zoom in on the 3D model using touch gestures.",
  "Click 'See in my World' to activate AR mode and view it in your space."
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
      audioRef.current.play()
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
      } else {
        console.error("Failed to activate AR");
      }
    }
  };

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
            ar={ar}
            shadow-intensity={shadowIntensity}
            camera-controls={cameraControls}
            auto-rotate={autoRotate}
            className={className}
            {...props}
          ></model-viewer>
          <button
            className="custom-ar-button bg-blue-500 px-4 py-2 rounded-xl absolute bottom-[20%] flex items-center space-x-2 shadow-md hover:bg-blue-700 focus:outline-none"
            onClick={activateAR}
          >
            <img
              src="./myplace.png"
              alt="AR Icon"
              className="w-8 h-8 filter invert"
            />
            <span className="text-white">
              {isARSupported ? "See in my World" : "See in my World"}
            </span>
          </button>
          {/* Play / Pause Audio Button */}
          <button
            onClick={isAudioPlaying ? stopAudio : playAudio}
            className="absolute bottom-10 right-4 p-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-all"
          >
            {isAudioPlaying ? <Pause size={24} /> : <Music size={24} />}
          </button>
          <button
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full shadow-lg hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          {/* App Tour Button */}
          <button
            onClick={() => {
              setIsTourVisible(true);
              setTourStep(0);
            }}
            className="absolute bottom-20 left-4 px-4 py-2 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-700"
          >
            App Tour
          </button>
          {/* App Tour Popup */}
          {isTourVisible && (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
                <p className="mb-4">{instructions[tourStep]}</p>
                <div className="flex justify-between">
                  <button
                    onClick={() => setIsTourVisible(false)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Skip
                  </button>
                  {tourStep < instructions.length - 1 ? (
                    <button
                      onClick={() => setTourStep(tourStep + 1)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsTourVisible(false);
                        setTourStep(0);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
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