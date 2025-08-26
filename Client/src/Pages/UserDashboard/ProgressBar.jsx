import React from "react";

export default function ProgressBar({ percentage }) {
  return (
    <div className="w-full mt-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-400">Avg Score of Last 5 Exams</span>
        <span className="text-sm font-medium text-blue-400">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
