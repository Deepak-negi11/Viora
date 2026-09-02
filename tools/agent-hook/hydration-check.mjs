// Two-socket check: user A cooks, user B joins late and should see A's activity on space-joined.
const API = "http://localhost:3001";
const EMAIL_B = "localtest3@test.dev";

await fetch(`${API}/api/v1/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "localtest3", email: EMAIL_B, password: "testpass123" }),
}).catch(() => {});
const signinB = await fetch(`${API}/api/v1/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL_B, password: "testpass123" }),
});
const tokenB = (await signinB.json()).token;

const signinA = await fetch(`${API}/api/v1/signin`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "localtest2@test.dev", password: "testpass123" }),
});
const tokenA = (await signinA.json()).token;

const spaceRes = await fetch(`${API}/api/v1/space`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
  body: JSON.stringify({ name: "Hydration Test", dimensions: "40x30", mapTemplate: "classic-office" }),
});
const spaceId = (await spaceRes.json()).spaceId;

const wsA = new WebSocket("ws://localhost:3001/ws");
wsA.onopen = () => wsA.send(JSON.stringify({ type: "join", payload: { spaceId, token: tokenA } }));

await new Promise((resolve) => {
  wsA.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.type === "space-joined") resolve();
  };
});

const postRes = await fetch(`${API}/api/v1/agent-activity`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenA}` },
  body: JSON.stringify({ text: "Claude is refactoring auth", state: "cooking" }),
});
console.log("A's POST response:", JSON.stringify(await postRes.json()));
await new Promise((r) => setTimeout(r, 1500));

const wsB = new WebSocket("ws://localhost:3001/ws");
const result = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("B never received activities on join")), 8000);
  wsB.onopen = () => wsB.send(JSON.stringify({ type: "join", payload: { spaceId, token: tokenB } }));
  wsB.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.type === "space-joined") {
      clearTimeout(timeout);
      console.log("B's raw space-joined payload keys:", Object.keys(m.payload));
      resolve(m.payload.agentActivities);
    }
  };
});

const activities = await result;
const entry = Object.values(activities ?? {})[0];
if (entry?.text === "Claude is refactoring auth" && entry.state === "cooking") {
  console.log("✅ HYDRATION OK — late joiner received:", JSON.stringify(activities));
} else {
  console.log("❌ unexpected:", JSON.stringify(activities));
  process.exit(1);
}

wsA.close();
wsB.close();
await fetch(`${API}/api/v1/space/${spaceId}`, { method: "DELETE", headers: { Authorization: `Bearer ${tokenA}` } });
process.exit(0);
