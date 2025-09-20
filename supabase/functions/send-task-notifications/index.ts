// supabase/functions/send-task-notifications/index.ts

function cors(req: Request) {
  const requested =
    req.headers.get("Access-Control-Request-Headers") ??
    "authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-api-version";
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": requested,
    "Vary": "Origin, Access-Control-Request-Headers",
    "Content-Type": "application/json",
  };
}

async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`RESEND ${r.status}: ${JSON.stringify(body)}`);
  return body; // includes id
}

Deno.serve(async (req) => {
  const CORS = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("FROM_EMAIL") || "Teamtegrate Support <support@requests.teamtegrate.com>";
    const base = Deno.env.get("APP_BASE_URL") || "https://teamtegrate.com";
    if (!apiKey) return new Response(JSON.stringify({ ok:false, error: "missing_resend_key" }), { status: 500, headers: CORS });

    const payload = await req.json().catch(() => ({}));
    // Accept either {to: "a@x.com"} or {recipients: ["a@x.com","b@y.com"]}
    let recipients: string[] = [];
    if (Array.isArray(payload.recipients)) recipients = payload.recipients.filter(Boolean);
    if (payload.to && typeof payload.to === "string") recipients.push(payload.to);
    recipients = [...new Set(recipients.map((e: string) => e?.trim()?.toLowerCase()).filter(Boolean))];

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok:false, error: "missing_recipients" }), { status: 400, headers: CORS });
    }

    const kind = payload.kind ?? "task_assigned";
    const task = payload.task ?? {};
    const subject =
      payload.subject ??
      (kind === "task_assigned"
        ? `📋 New Task: ${task.title ?? task.id}`
        : kind === "task_status_changed"
        ? `✅ Task Updated: ${task.title ?? task.id}`
        : `Task Notification: ${task.title ?? task.id}`);

    const url = `${base}/tasks/${task.id ?? ""}`;
    const html =
      payload.html ??
      `<h2>${subject}</h2>
       <p>${task.description ?? ""}</p>
       <p><a href="${url}">Open task</a></p>`;

    // Send one email per recipient and aggregate results
    const sends = await Promise.allSettled(
      recipients.map(async (to) => {
        const out = await sendViaResend(apiKey, from, to, subject, html);
        return { to, ok: true, id: out?.id ?? null };
      })
    );

    const results = sends.map((r) =>
      r.status === "fulfilled" ? r.value : { to: (r as any).reason?.to ?? null, ok: false, error: String(r.reason) }
    );
    const sent = results.filter((r: any) => r.ok).length;

    console.log("TASK_EMAIL_RESULTS", { kind, sent, total: recipients.length, results }); // visible in Supabase logs

    return new Response(JSON.stringify({ ok: sent > 0, sent, total: recipients.length, results }), {
      status: 200,
      headers: CORS,
    });
  } catch (e) {
    console.error("TASK_NOTIFY_ERROR", e);
    return new Response(JSON.stringify({ ok:false, error: String(e) }), { status: 500, headers: CORS });
  }
});