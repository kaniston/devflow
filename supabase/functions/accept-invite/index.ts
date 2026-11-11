/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck: This Deno Edge Function is validated using deno check.import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    try {
      const userId = ctx.userClaims?.id;
      const userEmail = ctx.userClaims?.email?.toLowerCase();

      if (!userId || !userEmail) {
        return Response.json(
          { error: "Please log in first." },
          { status: 401 },
        );
      }

      const body = await req.json();
      const invitationId = String(body.invitationId ?? "");

      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(invitationId)) {
        return Response.json(
          { error: "Invalid invitation." },
          { status: 400 },
        );
      }

      // Find the invitation securely.
      const { data: invitation, error: invitationError } =
        await ctx.supabaseAdmin
          .from("workspace_invitations")
          .select("id, workspace_id, email, role, status, expires_at")
          .eq("id", invitationId)
          .maybeSingle();

      if (invitationError || !invitation) {
        return Response.json(
          { error: "Invitation not found." },
          { status: 404 },
        );
      }

      // Ensure the invitation belongs to the logged-in user.
      if (invitation.email.toLowerCase() !== userEmail) {
        return Response.json(
          { error: "This invitation belongs to another email address." },
          { status: 403 },
        );
      }

      if (invitation.status !== "pending") {
        return Response.json(
          { error: "This invitation is no longer pending." },
          { status: 400 },
        );
      }

      if (new Date(invitation.expires_at).getTime() <= Date.now()) {
        await ctx.supabaseAdmin
          .from("workspace_invitations")
          .update({ status: "expired" })
          .eq("id", invitationId);

        return Response.json(
          { error: "This invitation has expired." },
          { status: 400 },
        );
      }

      // Add the authenticated user to the workspace.
      const { error: memberError } = await ctx.supabaseAdmin
        .from("workspace_members")
        .upsert(
          {
            workspace_id: invitation.workspace_id,
            user_id: userId,
            role: invitation.role,
          },
          { onConflict: "workspace_id,user_id" },
        );

      if (memberError) {
        console.error("Membership error:", memberError);

        return Response.json(
          { error: "Could not join the workspace." },
          { status: 500 },
        );
      }

      // Mark the invitation as accepted.
      const { error: updateError } = await ctx.supabaseAdmin
        .from("workspace_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitationId)
        .eq("status", "pending");

      if (updateError) {
        console.error("Invitation update error:", updateError);

        return Response.json(
          { error: "You joined, but the invitation status could not be updated. Please contact the workspace Admin." },
          { status: 500 },
        );
      }

      return Response.json({
        success: true,
        message: "You have successfully joined the workspace!",
        workspaceId: invitation.workspace_id,
        role: invitation.role,
      });
    } catch (error) {
      console.error("Accept invitation error:", error);

      return Response.json(
        { error: "An unexpected error occurred." },
        { status: 500 },
      );
    }
  }),
};
