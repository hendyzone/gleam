import React from "react";

interface MessageAudioProps {
  audioData: { data: string; format: string };
}

const MessageAudio: React.FC<MessageAudioProps> = ({ audioData }) => {
  // Construct data URL for audio
  const audioSrc = `data:audio/${audioData.format};base64,${audioData.data}`;

  return (
    <div className="gleam-message-audio" style={{ marginTop: "8px" }}>
      <audio
        controls
        style={{ maxWidth: "100%", height: "32px" }}
        src={audioSrc}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default MessageAudio;
