// Supabase Edge Function: create-user
//
// Creates a new auth user with the Admin API (service role key, never exposed
// to the browser) plus the matching students/teachers row, so Admins can
// provision accounts without asking the person to self-register.
//
// Deploy:  supabase functions deploy create-user
// Invoke from the client with supabase.functions.invoke('create-user', { body: {...} })
// The caller's JWT is verified and their role checked before anything is created.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";

interface CreateUserPayload {
  email: string;
  fullName: string;
  role: "admin" | "teacher" | "student";
  phone?: string;
  // student-specific
  application_id?: string;
  father_name?: string;
  address?: string;
  course_id?: string;
  batch_id?: string;
  enrollment_date?: string;
  // teacher-specific
  employee_id?: string;
  specialization?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client scoped to the caller's JWT, used only to check *their* role.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const { data: callerProfile } = await callerClient.from("profiles").select("role").eq("id", caller.id).single();
    if (!callerProfile || !["admin", "super_admin"].includes(callerProfile.role)) {
      throw new Error("Only admins can create users");
    }

    const payload: CreateUserPayload = await req.json();
    if (!payload.email || !payload.fullName || !payload.role) {
      throw new Error("email, fullName, and role are required");
    }

    // Admin client with the service role key — server-side only.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const tempPassword = crypto.randomUUID();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: payload.fullName, role: payload.role, provisioned_by_admin: "true" },
    });
    if (createError) throw createError;
    const userId = created.user.id;

    // The handle_new_user trigger already inserted a profiles row; patch phone if given.
    if (payload.phone) {
      await adminClient.from("profiles").update({ phone: payload.phone }).eq("id", userId);
    }

    if (payload.role === "student") {
      const { error } = await adminClient.from("students").insert({
        id: userId,
        application_id: payload.application_id ?? `APP-${Date.now()}`,
        father_name: payload.father_name,
        address: payload.address,
        course_id: payload.course_id || null,
        batch_id: payload.batch_id || null,
        enrollment_date: payload.enrollment_date ?? new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    }

    if (payload.role === "teacher") {
      const { error } = await adminClient.from("teachers").insert({
        id: userId,
        employee_id: payload.employee_id,
        specialization: payload.specialization,
      });
      if (error) throw error;
    }

    // Send a password-setup email so the new user can pick their own password.
    await adminClient.auth.resetPasswordForEmail(payload.email);

    return new Response(JSON.stringify({ userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
