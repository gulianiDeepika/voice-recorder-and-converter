import React, { useState, useRef } from "react";

const VoiceRecorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
      audioChunksRef.current = [];
      await convertToText(audioBlob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const convertToText = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");

    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
        },
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.text || "Could not transcribe audio.");
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setTranscript("Error transcribing audio.");
    }
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold">Voice Recorder</h2>
      <button
        onClick={recording ? stopRecording : startRecording}
        className="px-4 py-2 mt-4 rounded bg-blue-500 text-white"
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {audioURL && (
        <div className="mt-4">
          <audio controls src={audioURL} className="w-full" />
          <a
            href={audioURL}
            download="recording.wav"
            className="block mt-2 text-blue-500"
          >
            Download Recording
          </a>
        </div>
      )}
      {transcript && (
        <div className="mt-4 p-2 border border-gray-300 rounded">
          <h3 className="font-bold">Transcription:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
