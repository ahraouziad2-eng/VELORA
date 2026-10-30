import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, userId } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Use userId if provided (from signUp response), otherwise find by email via listUsers
    let targetUserId: string = userId || "";

    if (!targetUserId) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const user = usersData.users.find((u) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = user.id;
    }

    const { data: userData, error: getError } = await supabase.auth.admin.getUserById(targetUserId);
    if (getError) throw getError;

    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user.email_confirmed_at) {
      // Already confirmed — still ensure welcome notification exists
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "welcome")
        .limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "welcome",
          title: "مرحبًا بك في VELORA! 🌱",
          body: "يسعدنا انضمامك إلى منصة VELORA، وجهتك الرقمية لاكتشاف فرص الاستثمار في الأراضي الزراعية، والتواصل مع الملاك والفلاحين والمستثمرين.\nنتمنى لك تجربة مميزة ومثمرة معنا.\nVELORA — منصة واحدة. إمكانات لا حدود لها.",
          is_read: false,
        });
      }
      return new Response(JSON.stringify({ success: true, alreadyConfirmed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createdAt = new Date(user.created_at).getTime();
    const now = Date.now();
    const elapsed = now - createdAt;

    // Only auto-confirm accounts created within the last 5 minutes
    if (elapsed > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Registration timeout" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
      email_confirm: true,
    });

    if (updateError) throw updateError;

    // Insert welcome notification using service role (bypasses RLS)
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "welcome",
      title: "مرحبًا بك في VELORA! 🌱",
      body: "يسعدنا انضمامك إلى منصة VELORA، وجهتك الرقمية لاكتشاف فرص الاستثمار في الأراضي الزراعية، والتواصل مع الملاك والفلاحين والمستثمرين.\nنتمنى لك تجربة مميزة ومثمرة معنا.\nVELORA — منصة واحدة. إمكانات لا حدود لها.",
      is_read: false,
    });

    if (notifError) {
      console.error("Welcome notification error:", notifError.message);
    }

    return new Response(JSON.stringify({ success: true, alreadyConfirmed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
