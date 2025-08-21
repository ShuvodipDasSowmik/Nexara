import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import API from "../../API/axios";

export default function LastFiveScoresChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/users/last-five-scores").then(res => {
      console.log("Last five scores API response:", res.data);
      setData(res.data || []);
    }).catch(err => {
      console.error("Error fetching last five scores:", err);
    });
  }, []);


  if (!data.length) return (
    <div className="text-red-400 text-center my-4">No score data found for last five exams.<br/>Check API/network or backend data.</div>
  );

  // Custom tooltip for dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(30,41,59,0.98)', color: '#fff', border: '1px solid #334155', boxShadow: '0 2px 8px #0008', padding: 12, borderRadius: 8, fontSize: 14 }}>
          <div className="mb-1"><span className="font-semibold text-blue-300">Exam ID:</span> {label || 'N/A'}</div>
          <div><span className="font-semibold text-purple-300">Percentage:</span> {payload[0].value}%</div>
        </div>
      );
    }
    return null;
  };

  // Gradient for bars
  const gradientId = "barGradient";

  // Map data to provide a fallback label for bars with null examId
  const chartData = [...data].reverse().map((item, idx) => ({
    ...item,
    label: item.examId !== null && item.examId !== undefined ? String(item.examId) : `Score ${data.length - idx}`
  }));

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-white mb-4 tracking-wide">Last 5 Exam Scores</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barCategoryGap={30}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a21caf" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" label={{ value: "Exam", position: "insideBottom", offset: -5, fill: '#cbd5e1', fontSize: 14 }} tick={{ fill: '#cbd5e1', fontSize: 13 }} />
          <YAxis domain={[0, 100]} label={{ value: "Percentage", angle: -90, position: "insideLeft", fill: '#cbd5e1', fontSize: 14 }} tick={{ fill: '#cbd5e1', fontSize: 13 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} wrapperStyle={{ boxShadow: 'none' }} />
          <Bar dataKey="percentage" fill={`url(#${gradientId})`} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
