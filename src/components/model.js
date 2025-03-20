import "@google/model-viewer";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heading1, Music, Pause } from "lucide-react";

const instructions = [
  "Welcome to the 3D Model Viewer! Click 'Next' to continue.",
  "You can rotate and zoom in on the 3D model using touch gestures.",
  "Click 'See in my World' to activate AR mode and view it in your space.",
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
      } else {
        console.error("Failed to activate AR");
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="bg-white w-4/5 absolute text-black top-[10%]"></div>

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

          <div className="absolute p-2 items-center rounded-2xl justify-between top-5 text-gray-500 w-[90%] flex bg-white border-2 px-4">
            <button
              onClick={() => router.push("/")}
              className="relative text-xl flex items-center hover:bg-gray-200"
            >
              <span>X</span>
            </button>

            <p className="text-black font-semibold">NAME</p>

            {/* App Tour Button */}
            <button
              onClick={() => {
                setIsTourVisible(true);
                setTourStep(0);
              }}
              className="relative px-2 bg-white rounded-full border-2 border-gray-500 shadow-lg hover:bg-green-700"
            >
              ?
            </button>
            {/* App Tour Popup */}
            {isTourVisible && (
              <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm text-center">
                  <p className="mb-4">{instructions[tourStep]}</p>
                  <div className="flex justify-center">
                    {/* <button
                    onClick={() => setIsTourVisible(false)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  >
                    Skip
                  </button> */}
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
          </div>
          {/* Play / Pause Audio Button */}
          <button
            onClick={isAudioPlaying ? stopAudio : playAudio}
            className="absolute bottom-[15%] right-4 p-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-all"
          >
            {isAudioPlaying ? <Pause size={24} /> : <Music size={24} />}
          </button>

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
        </>
      ) : (
        <p>Loading, please wait...</p>
      )}
    </div>
  );
};

export default Model;
