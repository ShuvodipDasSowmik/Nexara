import React, { useEffect } from "react";

function GroupCallVideoGrid({ localStream, remoteStreams, localVideoRef }) {
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  return (
    <div className="flex flex-wrap justify-center items-center gap-4 py-4">
      <div className="relative">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="rounded-lg border-2 border-blue-500 w-64 h-40 bg-black"
        />
        <span className="absolute bottom-2 left-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">You</span>
      </div>
      {remoteStreams.map((stream, idx) => (
        <div key={stream.id || idx} className="relative">
          <video
            autoPlay
            playsInline
            className="rounded-lg border-2 border-purple-500 w-64 h-40 bg-black"
            ref={el => {
              if (el) el.srcObject = stream;
            }}
          />
          <span className="absolute bottom-2 left-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">User {idx + 1}</span>
        </div>
      ))}
    </div>
  );
}

export default GroupCallVideoGrid;
