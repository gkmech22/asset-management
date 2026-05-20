import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateUserPayload = {
  email?: string;
  password?: string;
  department?: string;
  role?: string;
  account_type?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload: CreateUserPayload = await req.json();
    const email = payload.email ? normalizeEmail(payload.email) : "";
    const role = payload.role?.trim() || "Reporter";
    const department = payload.department?.trim() || null;
    const accountType = payload.account_type?.trim() || "Standard";
    const password = payload.password?.trim() || crypto.randomUUID();

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "A valid email address is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerData, error: callerError } = await userClient.auth.getUser();
    if (callerError || !callerData.user?.email) {
      return new Response(JSON.stringify({ error: "You must be signed in to add users." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerProfile, error: profileError } = await adminClient
      .from("users")
      .select("role, account_type")
      .eq("email", normalizeEmail(callerData.user.email))
      .maybeSingle();

    if (profileError) throw profileError;

    const callerRole = String(callerProfile?.role || callerProfile?.account_type || "").toLowerCase();
    const isSuperAdmin = callerRole === "super admin" || callerRole === "super_admin" || callerRole === "superadmin";
    const isAdmin = callerRole === "admin" || isSuperAdmin;

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only admins can add users." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isSuperAdmin && ["admin", "super admin", "super_admin", "superadmin"].includes(role.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Admins can only create Operator or Reporter users." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let authUserId: string | undefined;
    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { department, role, account_type: accountType },
    });

    if (createError) {
      const alreadyExists = createError.message.toLowerCase().includes("already") || createError.status === 422;
      if (!alreadyExists) throw createError;

      const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;
      authUserId = existingUsers.users.find((existingUser) => normalizeEmail(existingUser.email || "") === email)?.id;

      if (!authUserId) {
        return new Response(JSON.stringify({ error: "This email already exists in Auth, but the user could not be linked." }), {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } else {
      authUserId = createdUser.user?.id;
    }

    if (!authUserId) {
      throw new Error("Unable to create or locate the auth user.");
    }

    const { error: upsertError } = await adminClient.from("users").upsert(
      {
        id: authUserId,
        email,
        department,
        role,
        account_type: accountType,
      },
      { onConflict: "email" }
    );

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ id: authUserId, email }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in create-user-admin function:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to create user." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
