import React, { useState } from "react";

function GroupCallControls({ joined, isRoomFull, onJoin, onLeave, roomId }) {
  const [inputRoomId, setInputRoomId] = useState(roomId || "");

  return (
    <div className="flex justify-center items-center py-2">
      {!joined ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Room ID"
            value={inputRoomId}
            onChange={e => setInputRoomId(e.target.value)}
            className="px-2 py-1 rounded border border-gray-600 bg-gray-900 text-white"
          />
          <button
            onClick={() => onJoin(inputRoomId)}
            disabled={!inputRoomId || isRoomFull}
            className={`px-3 py-1 rounded-md text-white ${isRoomFull ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"} transition-colors`}
          >
            {isRoomFull ? "Room Full" : "Join Call"}
          </button>
        </div>
      ) : (
        <button
          onClick={onLeave}
          className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          Leave Call
        </button>
      )}
    </div>
  );
}

export default GroupCallControls;
