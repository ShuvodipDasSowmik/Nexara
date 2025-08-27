import React from "react";

function GroupCallSidebar({ roomId, userCount, maxUsers, isRoomFull, onJoin, joined }) {
  return (
    <aside className="w-64 bg-gray-900/80 border-r border-gray-700/50 flex flex-col justify-between py-4 px-3">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Group Call Room</h2>
        <div className="mb-4">
          <span className="text-gray-300">Room ID:</span>
          <span className="ml-2 text-blue-400 font-mono">{roomId || "Not joined"}</span>
        </div>
        <div className="mb-4">
          <span className="text-gray-300">Users:</span>
          <span className="ml-2 text-purple-400">{userCount} / {maxUsers}</span>
        </div>
        {isRoomFull && !joined && (
          <div className="text-red-500 text-sm mb-2">Room is full. Please try another room.</div>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-400">Nexara Group Call</p>
      </div>
    </aside>
  );
}

export default GroupCallSidebar;
