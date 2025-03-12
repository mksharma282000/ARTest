"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LuScanLine } from "react-icons/lu";

export default function Home() {
  const videoRef = useRef(null);
  // const [fullscreen, setFullscreen] = useState<boolean>(false);
  const photoRef = useRef(null);
  const cropRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  // const [orientation, setOrientation] = useState("portrait");
  const [cleanBase64, setBase64] = useState("");
  const [send, setData] = useState(false);
  // const [winWidth, setWidth] = useState(null);
  // const [winHeight, setHeight] = useState(null);
  const [change, setchange] = useState(false);
  const [items, setItem] = useState([]);
  const [scannedText, setScannedText] = useState("");
  const [selected, setSelected] = useState("");
  const [word, setWord] = useState(""); // Define word state globally

  const router = useRouter();
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

  const getVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Apply autofocus if supported
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        const settings = videoTrack.getSettings();

        if (
          capabilities.focusMode &&
          capabilities.focusMode.includes("continuous")
        ) {
          await videoTrack.applyConstraints({
            advanced: [{ focusMode: "continuous" }],
          });
          console.log("Autofocus applied:", settings.focusMode);
        } else {
          console.warn("Autofocus is not supported on this device.");
        }
      }
    } catch (error) {
      console.error("Error getting video stream", error);
    }
  };

  const analyzeImage = async (base64Image) => {
    console.log("entered OCR processing...");
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_API_KEY;
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: "DOCUMENT_TEXT_DETECTION",
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (
        response.ok &&
        data.responses &&
        data.responses[0].fullTextAnnotation
      ) {
        let extractedWord = data.responses[0].fullTextAnnotation.text.trim();
        if (!extractedWord) return;

        console.log("Extracted OCR Word:", extractedWord);

        // Call refineText to ensure spelling correction while maintaining language
        const refinedWord = await refineText(extractedWord);
        if (!refinedWord) return;

        console.log("Refined Word:", refinedWord);
        setScannedText(refinedWord);
        setWord(refinedWord); // Update the state with the refined word

        // Now match the **refined word** with items, NOT the raw OCR word
        const lowerCaseItems = items.map((item) => item.toLowerCase());
        let foundMatch = false;

        refinedWord.split("\n").forEach((element) => {
          const x = element.toLowerCase();
          if (lowerCaseItems.includes(x)) {
            console.log("Matched Item:", x);
            window.sessionStorage.setItem("word", x); // Store only the refined word
            foundMatch = true;
            setchange(true);
          }
        });

        if (!foundMatch) {
          console.warn("No match found for refined word:", refinedWord);
        }
      } else {
        console.error("Error from API:", data.error?.message);
      }
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const refineText = async (word) => {
    const GEMINI_API_KEY = "AIzaSyCi0SpePLAR5gLiwen8lyQAAiOqpZPbl4E";

    if (!GEMINI_API_KEY) {
      console.error("Gemini API key is missing.");
      return;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Refine this text: "${word}". 
              1. **Keep the word in its original language** (English stays English, Hindi stays Hindi).
              2. **Fix spelling mistakes** if present.
              3. **Do not translate between Hindi and English**.
              4. Return the refined word in **the same detected language**.
  
              Example Outputs:
              - Input: "aaple" -> Output: "apple"
              - Input: "सेब" -> Output: "सेब"
              - Input: "seb" -> Output: "सेब"
              - Input: "mango" -> Output: "mango"
              - Input: "मैंगो" -> Output: "मैंगो"
              
              Provide **only the refined word** as the response.`,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Raw API Response:", data);

      if (data && data.candidates && data.candidates.length > 0) {
        const refinedText = data.candidates[0].content.parts[0].text.trim();
        return refinedText;
      } else {
        console.error("Unexpected API response format:", data);
        return word; // Fallback: Return original word if API fails
      }
    } catch (error) {
      console.error("Error refining text:", error);
      return word; // Fallback
    }
  };

  // Automatically refine scanned text after scanning
  useEffect(() => {
    if (scannedText) {
      refineText(scannedText);
    }
  }, [scannedText]);

  const takePhoto = () => {
    console.log("clicked");
    if (!videoRef.current || !photoRef.current) return;
    if (typeof window !== "undefined") {
      // Define the dimensions of the area of interest (scanner box)
      const boxWidth = 320; // width of the scanner box in pixels
      const boxHeight = 320; // height of the scanner box in pixels

      const video = videoRef.current;
      const photo = photoRef.current;
      if (!photo)
        return () => {
          console.error("Can not opencanvas");
        };
      const offsetX = (video.videoWidth - boxWidth) / 2; // X offset for centering
      const offsetY = (video.videoHeight - boxHeight) / 2; // Y offset for centering
      photo.width = boxWidth;
      photo.height = boxHeight;

      const ctx = photo.getContext("2d");
      if (!ctx)
        return () => {
          console.error("Can not opencanvas");
        };
      ctx.clearRect(0, 0, boxWidth, boxHeight);
      ctx.drawImage(
        video,
        offsetX, // Source X
        offsetY, // Source Y
        boxWidth, // Source width
        boxHeight, // Source height
        0, // Destination X
        0, // Destination Y
        boxWidth, // Destination width
        boxHeight // Destination height
      );
      setIsVisible(true);
      const image = photo.toDataURL("image/base64", 0.5);
      const imgData = image.split(",")[1];
      setBase64(imgData);
      console.log(cleanBase64);
      setData(true);
    } else {
    }
  };

  const drawScannedTextToCanvas = async () => {
    const canvas = photoRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");

      // Define canvas dimensions and styling
      const padding = 20; // Padding around the text
      const maxWidth = 300; // Max width of the canvas
      const lineHeight = 20; // Line height for text

      // Calculate canvas height based on text lines
      const lines = scannedText.trim().split("\n");
      console.log(lines);
      const canvasHeight = lines.length * lineHeight + padding * 2;
      const match = lines.find((line) => {
        const x = line.toLowerCase();
        console.log(x);
        items.includes(x);
      });
      console.log(match);
      if (match) {
        console.log(match.toLowerCase());
        await AsyncStorage.setItem("word", match.toLowerCase());
        setTimeout(() => {
          setchange(true);
        }, 2000);
      } else {
      }

      // Set canvas size
      canvas.width = maxWidth;
      canvas.height = canvasHeight;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the background with rounded corners and shadow
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;

      ctx.beginPath();
      const radius = 10; // Rounded corner radius
      ctx.moveTo(radius, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
      ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
      ctx.arcTo(0, canvas.height, 0, 0, radius);
      ctx.arcTo(0, 0, canvas.width, 0, radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reset shadow for text
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw the text
      ctx.fillStyle = "#333333";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "center";

      const y = padding + lineHeight;
      ctx.fillText(lines, canvas.width / 2, y);

      // Add animation for a "pop-out" effect
      canvas.style.transition =
        "transform 0.4s ease-out, opacity 0.4s ease-in-out";
      canvas.style.transform = "scale(1.2)";
      canvas.style.opacity = "0.2";

      setTimeout(() => {
        canvas.style.transform = "scale(1.3)";
        canvas.style.opacity = "1";
      }, 300);

      // Center and display the canvas
      canvas.style.position = "absolute";
      canvas.style.top = "50%";
      canvas.style.left = "30%";
      canvas.style.transform = "translate(0%, 0%)"; // Fix for perfect centering
      canvas.style.borderRadius = "20px";
      canvas.style.boxShadow = "0 15px 30px rgba(0, 0, 0, 0.3)";
      canvas.style.background =
        "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)";
      canvas.style.padding = "10px";
      canvas.style.zIndex = 100;
    }
  };

  const drawToCanvas = () => {
    const video = videoRef.current;

    if (video) {
      const drawFrame = () => {
        const canvas = cropRef.current;
        const boxWidth = 300; // width of the scanner box in pixels
        const boxHeight = 300; // height of the scanner box in pixel
        if (!canvas) return;
        canvas.width = boxWidth;
        canvas.height = boxHeight;

        const ctx = canvas.getContext("2d");
        const offsetX = (video.videoWidth - boxWidth) / 2; // X offset for centering
        const offsetY = (video.videoHeight - boxHeight) / 2; // Y offset for centering
        // Draw the current video frame to the canvas
        ctx.drawImage(
          video,
          offsetX, // Source X
          offsetY, // Source Y
          boxWidth, // Source width
          boxHeight, // Source height
          0, // Destination X
          0, // Destination Y
          boxWidth, // Destination width
          boxHeight // Destination height
        );
        // Continue drawing frames
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    }
  };

  if (change) {
    console.log("pagechange");
  } else {
  } // Add your else condition here if needed.

  if (send) {
    analyzeImage(cleanBase64);
    setData(false);
  } else {
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await getModels();
        console.log("Data fetched:", data);
        const objectNames = data.map((item) => item.object_name);
        console.log("Objects fetched:", objectNames);
        setItem(objectNames || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    })();
  }, [getModels]);

  useEffect(() => {
    if (scannedText) {
      drawScannedTextToCanvas(); // Draw the text to the canvas when available
    }
  }, [scannedText]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      getVideo();
    } else {
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      drawToCanvas();
    } else {
    }
  }, [videoRef]);

  useEffect(() => {
    if (!change) return;
    router.push("/model");
    setchange(false);
  }, [router, change]);

  return (
    <div className="relative flex justify-center items-center h-screen w-screen bg-gray-600 overflow-hidden">
      {/* Video Stream */}
      <video
        className="absolute w-full h-full object-cover"
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-xl z-10"></div>
      {/* Photo Canvas */}
      <canvas
        className={`absolute z-30 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }  top-12 w-auto max-w-full max-h-full bg-black`}
        ref={photoRef}
      ></canvas>
      {/* Cropping Canvas and Frame */}
      <div className="relative z-40 flex flex-col items-center">
        {/* Wrapper for the canvas */}
        <div className="relative">
          {/* Cropping Canvas */}
          <canvas
            className="shadow-lg rounded-3xl max-w-[90vw] max-h-[90vh] mx-auto"
            ref={cropRef}
          ></canvas>

          {/* Corner Borders - Positioned Outside the Canvas */}
          <div className="absolute top-[-12px] left-[-12px] w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl animate-scanner-top-left"></div>
          <div className="absolute top-[-12px] right-[-12px] w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl animate-scanner-top-right"></div>
          <div className="absolute bottom-[-12px] left-[-12px] w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl animate-scanner-bottom-left"></div>
          <div className="absolute bottom-[-12px] right-[-12px] w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl animate-scanner-bottom-right"></div>
        </div>
      </div>
      ;{/* Button Section */}
      <div className="absolute bottom-[20%] md:bottom-20 z-50 w-full flex justify-center">
        <button
          className="flex items-center gap-3 bg-blue-600 text-white font-bold rounded-full px-5 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
          onClick={takePhoto}
        >
          <LuScanLine className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
          <span className="text-base md:text-lg lg:text-xl">Click to Scan</span>
        </button>
      </div>
    </div>
  );
}
