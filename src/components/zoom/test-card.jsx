import { useEffect, useState } from "react";

export default function TestCard() {
  const [events, setEvents] = useState([]);
  const [loadedAt] = useState(new Date().toLocaleString());

  useEffect(() => {
    const handler = (event) => {
      console.log("Chatwoot event:", event.data);
      setEvents((prev) => [JSON.stringify(event.data), ...prev].slice(0, 5));
    };

    window.addEventListener("message", handler);

    // Ask Chatwoot for the current conversation context
    window.parent?.postMessage("chatwoot-dashboard-app:fetch-info", "*");

    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Dashboard app loaded</h1>
      <p>Loaded at: {loadedAt}</p>
      <p>If you can see this, the iframe is working.</p>

      <h2>Recent events</h2>
      <pre
        style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 12 }}
      >
        {events.length ? events.join("\n\n") : "No Chatwoot event received yet"}
      </pre>
    </div>
  );
}
