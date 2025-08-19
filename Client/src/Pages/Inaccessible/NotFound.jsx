import React from "react";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200 px-4">
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/60 p-8 max-w-md w-full text-center">
      <div className="text-6xl mb-2">🚫</div>
      <h1 className="text-2xl font-bold mb-2">404 - Not Found</h1>
      <p className="text-base text-gray-300 mb-4">
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
      >
        Go Home
      </a>
    </div>
  </div>
);

export default NotFound;
