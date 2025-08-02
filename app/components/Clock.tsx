"use client";

import { useState, useEffect } from "react";

/**
 * Clock Component
 *
 * Displays the current time and date in the top right corner
 * Updates every second to show real-time information
 * Uses the same edgy orange styling as the username
 */
export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Format time as HH:MM:SS
  const timeString = time.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Format date as Day, Month DD, YYYY
  const dateString = time.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="clock">
      <div className="clock-time">{timeString}</div>
      <div className="clock-date">{dateString}</div>
    </div>
  );
}
