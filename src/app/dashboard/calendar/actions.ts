"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function toIso(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships, error: membershipError } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", user.id)
    .limit(1);

  if (membershipError) throw new Error(membershipError.message);
  const membership = memberships?.[0];
  if (!membership) redirect("/onboarding");
  if (!["owner", "admin", "editor"].includes(membership.role)) {
    throw new Error("Vous n'avez pas les droits pour créer une publication.");
  }

  const title = String(formData.get("title") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const scheduledAt = toIso(formData.get("scheduled_at"));
  const platforms = ["facebook", "instagram", "tiktok"].filter(
    (platform) => formData.get(platform) === "on",
  );
  const requestedMedia = formData
    .getAll("media_paths")
    .filter((value): value is string => typeof value === "string")
    .filter((path) => path.startsWith(`${membership.company_id}/`))
    .slice(0, 10);

  if (!content) throw new Error("Le texte de la publication est obligatoire.");

  let mediaPaths: string[] = [];
  if (requestedMedia.length) {
    const { data: assets, error: assetError } = await supabase
      .from("media_assets")
      .select("object_path")
      .eq("company_id", membership.company_id)
      .in("object_path", requestedMedia);

    if (assetError) throw new Error(assetError.message);
    mediaPaths = assets?.map((asset) => asset.object_path) ?? [];
  }

  const status = scheduledAt ? "scheduled" : "draft";
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      company_id: membership.company_id,
      created_by: user.id,
      title,
      content,
      media_urls: mediaPaths,
      scheduled_at: scheduledAt,
      status,
    })
    .select("id")
    .single();

  if (postError) throw new Error(postError.message);

  if (platforms.length) {
    const { error: targetError } = await supabase.from("post_targets").insert(
      platforms.map((platform) => ({
        post_id: post.id,
        company_id: membership.company_id,
        platform,
        status,
      })),
    );
    if (targetError) throw new Error(targetError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  redirect("/dashboard/calendar");
}
