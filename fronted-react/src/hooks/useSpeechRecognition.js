import { useCallback, useEffect, useRef, useState } from "react";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function useSpeechRecognition({ onResult, onError } = {}) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(Boolean(SpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      onError?.("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (recognitionRef.current) {
      stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        onResult?.(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      const messages = {
        "not-allowed": "Microphone access denied. Allow microphone permission in your browser settings.",
        "service-not-allowed": "Microphone access blocked. Check browser permissions.",
        "no-speech": "No speech detected. Please try again.",
        "network": "Speech recognition network error. Check your connection.",
        "aborted": "Speech recognition was cancelled.",
      };
      onError?.(messages[event.error] || `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      onError?.("Could not start microphone. It may already be in use.");
      setListening(false);
    }
  }, [onError, onResult, stop]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, start, stop, toggle };
}
