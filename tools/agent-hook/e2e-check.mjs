// Quick e2e check: join a space over WS, then POST agent-activity and expect the broadcast.
const API = "http://localhost:3001";

const signin = await fetch(`${API}/api/v1/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "localtest2@test.dev", password: "testpass123" }),
});
const { token } = await signin.json();

const spaceRes = await fetch(`${API}/api/v1/space`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ name: "Agent Test Space", dimensions: "40x30", mapTemplate: "classic-office" }),
});
const space = await spaceRes.json();
const spaceId = space.spaceId ?? space.data?.spaceId ?? space.id;
if (!spaceId) {
  console.log("space create failed:", JSON.stringify(space));
  process.exit(1);
}
console.log("space created:", spaceId);

const ws = new WebSocket("ws://localhost:3001/ws");
ws.onopen = () => ws.send(JSON.stringify({ type: "join", payload: { spaceId, token } }));

const received = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("no agent-activity broadcast within 8s")), 8000);
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "space-joined") {
      console.log("joined, users in space:", message.payload.users.length);
      console.log("activities on join:", JSON.stringify(message.payload.agentActivities ?? {}));
      setTimeout(async () => {
        const res = await fetch(`${API}/api/v1/agent-activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: "Claude is using Edit page.tsx", state: "cooking" }),
        });
        console.log("REST response:", JSON.stringify(await res.json()));
      }, 2500);
    }
    if (message.type === "agent-activity") {
      clearTimeout(timeout);
      resolve(message.payload);
    }
  };
});

const payload = await received;
console.log("✅ BROADCAST RECEIVED:", JSON.stringify(payload));
ws.close();
await new Promise((r) => setTimeout(r, 500));

// cleanup space
await fetch(`${API}/api/v1/space/${spaceId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});
process.exit(0);
