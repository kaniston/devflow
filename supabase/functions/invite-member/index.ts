/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck: This Deno Edge Function is validated using deno check.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const allowedRoles = ["Admin", "Manager", "Developer", "Designer"];

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    try {
      // Get the logged-in user's ID and email.
      const userId = ctx.userClaims?.id;
      const userEmail = ctx.userClaims?.email?.toLowerCase();

      if (!userId || !userEmail) {
        return Response.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Read invitation details.
      const body = await req.json();

      const email = String(body.email ?? "").trim().toLowerCase();
      const role = String(body.role ?? "Developer");
      const workspaceId = String(body.workspaceId ?? "");

      // Validate email.
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        return Response.json(
          { error: "Enter a valid email address." },
          { status: 400 },
        );
      }

      // Validate role.
      if (!allowedRoles.includes(role)) {
        return Response.json(
          { error: "Invalid team role." },
          { status: 400 },
        );
      }

      // Validate workspace ID.
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(workspaceId)) {
        return Response.json(
          { error: "Invalid workspace." },
          { status: 400 },
        );
      }

      // Verify that the caller is an Admin of this workspace.
      const { data: membership, error: membershipError } =
        await ctx.supabase
          .from("workspace_members")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .eq("role", "Admin")
          .maybeSingle();

      if (membershipError || !membership) {
        return Response.json(
          { error: "Only workspace Admins can invite members." },
          { status: 403 },
        );
      }

      // Prevent inviting yourself.
      if (userEmail === email) {
        return Response.json(
          { error: "You cannot invite your own email address." },
          { status: 400 },
        );
      }

      // Save the invitation in Supabase.
      const { data: invitation, error: insertError } =
        await ctx.supabaseAdmin
          .from("workspace_invitations")
          .insert({
            workspace_id: workspaceId,
            email,
            role,
            invited_by: userId,
          })
          .select("id")
          .single();

      if (insertError || !invitation) {
        console.error("Invitation insert error:", insertError);

        return Response.json(
          {
            error:
              "Could not create invitation. Check whether a pending invitation already exists.",
          },
          { status: 400 },
        );
      }

      // Get the application URL.
      const appUrl = (
        Deno.env.get("APP_URL") ?? "http://localhost:5173"
      ).replace(/\/+$/, "");

      // Send the invitation email.
      const { error: inviteError } =
        await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${appUrl}/accept-invite?invitation=${invitation.id}`,
        });

      // Cancel the invitation if email sending fails.
      if (inviteError) {
        console.error("Invitation email error:", inviteError);

        await ctx.supabaseAdmin
          .from("workspace_invitations")
          .update({ status: "cancelled" })
          .eq("id", invitation.id);

        return Response.json(
          { error: inviteError.message },
          { status: 400 },
        );
      }

      // Successful response.
      return Response.json({
        success: true,
        message: "Invitation email sent successfully.",
        invitationId: invitation.id,
        email,
        role,
      });

    } catch (error) {
      console.error("Invitation error:", error);

      return Response.json(
        {
          error:
            "An unexpected error occurred while sending the invitation.",
        },
        { status: 500 },
      );
    }
  }),
};
