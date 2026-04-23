import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { APP_AVATAR_COOKIE } from "@/lib/session";

const PROFILE_AVATAR_BUCKET = "profile-avatars";
const PROFILE_AVATAR_LIMIT = 2 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("[api/profile] auth_unavailable");
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const formData = await request.formData();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const existingAvatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const avatarFile = formData.get("avatar");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[api/profile] unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let avatarUrl = existingAvatarUrl || null;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const admin = getSupabaseAdminClient();

    if (!admin) {
      console.error("[api/profile] storage_unavailable");
      return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
    }

    const buckets = await admin.storage.listBuckets();
    const existingBucket = buckets.data?.find((bucket) => bucket.name === PROFILE_AVATAR_BUCKET);

    if (!existingBucket) {
      const created = await admin.storage.createBucket(PROFILE_AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: PROFILE_AVATAR_LIMIT
      });

      if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
        console.error("[api/profile] create_bucket_failed", created.error.message);
        return NextResponse.json({ error: created.error.message }, { status: 400 });
      }
    } else if (existingBucket.file_size_limit !== PROFILE_AVATAR_LIMIT) {
      const updated = await admin.storage.updateBucket(PROFILE_AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: PROFILE_AVATAR_LIMIT
      });

      if (updated.error) {
        console.error("[api/profile] update_bucket_failed", updated.error.message);
        return NextResponse.json({ error: updated.error.message }, { status: 400 });
      }
    }

    const extension = avatarFile.name.includes(".") ? avatarFile.name.split(".").pop()?.toLowerCase() ?? "png" : "png";
    const safeBaseName = avatarFile.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 40) || "avatar";
    const filePath = `avatars/${user.id}/${Date.now()}-${safeBaseName}.${extension}`;
    const bytes = await avatarFile.arrayBuffer();
    const upload = await admin.storage.from(PROFILE_AVATAR_BUCKET).upload(filePath, Buffer.from(bytes), {
      contentType: avatarFile.type || "image/png",
      upsert: true
    });

    if (upload.error) {
      console.error("[api/profile] upload_failed", upload.error.message);
      return NextResponse.json({ error: upload.error.message }, { status: 400 });
    }

    avatarUrl = admin.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(filePath).data.publicUrl;
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName || null,
      full_name: displayName || null,
      avatar_url: avatarUrl
    }
  });

  if (error) {
    console.error("[api/profile] update_user_failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    profile: {
      displayName:
        typeof data.user?.user_metadata?.display_name === "string"
          ? data.user.user_metadata.display_name
          : displayName || null,
      avatarUrl:
        typeof data.user?.user_metadata?.avatar_url === "string"
          ? data.user.user_metadata.avatar_url
          : avatarUrl
    }
  });

  response.cookies.set(APP_AVATAR_COOKIE, avatarUrl ?? "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
