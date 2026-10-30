import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WELCOME_SUBJECT = "مرحبًا بك في VELORA – شكرًا لانضمامك إلينا";

function buildWelcomeHtml(fullName: string): string {
  const logoHtml = `<h1 style="margin:0;color:#FFFFFF;font-size:30px;font-weight:800;letter-spacing:3px;">VELORA</h1>`;
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Segoe UI,Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#14532d 0%,#15803d 100%);padding:36px 40px;text-align:center;">
          ${logoHtml}
          <p style="margin:8px 0 0;color:#DCFCE7;font-size:13px;">منصة واحدة. إمكانات لا حدود لها.</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 20px;color:#0F172A;font-size:22px;font-weight:700;text-align:right;">مرحبًا بك في VELORA،</h2>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;text-align:right;">${fullName ? `شكرًا لاختيارك تطبيق VELORA وانضمامك إلى مجتمعنا يا ${fullName}.` : 'شكرًا لاختيارك تطبيق VELORA وانضمامك إلى مجتمعنا.'}</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;text-align:right;">يسعدنا أن نرافقك في اكتشاف فرص الأراضي الزراعية والعقارية، والتواصل مع أصحاب الأراضي والمستثمرين، والاستفادة من الخدمات التي تقدمها منصتنا.</p>
          <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;text-align:right;">نهدف إلى توفير تجربة سهلة تساعدك على اكتشاف الفرص وإدارة طلباتك ومتابعة اهتماماتك بكل سهولة.</p>
          <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.8;text-align:right;">نتمنى لك تجربة مميزة ومثمرة مع VELORA.</p>
          <p style="margin:0;color:#2563EB;font-size:15px;font-weight:600;text-align:right;">مع أطيب التحيات،<br/>فريق VELORA.</p>
        </td></tr>
        <tr><td style="background:#F8FAFC;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#94A3B8;font-size:12px;">© VELORA — جميع الحقوق محفوظة</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendWelcomeEmail(toEmail: string, fullName: string): Promise<{ sent: boolean; reason?: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  if (!resendKey) {
    console.warn("welcome-email: RESEND_API_KEY not configured — welcome email was not sent.");
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const fromEmail = Deno.env.get("WELCOME_FROM_EMAIL") || "welcome@velora.app";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `VELORA <${fromEmail}>`,
        to: [toEmail],
        subject: WELCOME_SUBJECT,
        html: buildWelcomeHtml(fullName),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`welcome-email: Resend API error ${res.status}: ${body}`);
      return { sent: false, reason: `Resend API ${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.error("welcome-email: fetch failed:", (err as Error).message);
    return { sent: false, reason: "fetch failed" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, fullName, userId } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Idempotency: check if a welcome email was already sent for this user.
    const targetUserId = userId || "";
    if (targetUserId) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("type", "welcome_email_sent")
        .limit(1);
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ success: true, alreadySent: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const result = await sendWelcomeEmail(email, fullName || "");

    // Record that we attempted to send so repeated calls don't duplicate.
    if (targetUserId) {
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "welcome_email_sent",
        title: "welcome email",
        body: result.sent ? "sent" : `failed: ${result.reason || "unknown"}`,
        is_read: true,
      }).then(() => {}, (e: Error) => console.error("welcome-email: marker insert failed:", e.message));
    }

    return new Response(JSON.stringify({ success: true, emailSent: result.sent, reason: result.reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
