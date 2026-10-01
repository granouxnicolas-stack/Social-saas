"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]);

export function MediaUploader({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    if (!allowedTypes.has(file.type)) {
      setMessage("Format non pris en charge.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage("Le fichier dépasse 50 Mo.");
      return;
    }

    setBusy(true);
    setMessage("");

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const objectPath = `${companyId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("social-media")
      .upload(objectPath, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setMessage(uploadError.message);
      setBusy(false);
      return;
    }

    const { error: assetError } = await supabase.from("media_assets").insert({
      company_id: companyId,
      object_path: objectPath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });

    if (assetError) {
      await supabase.storage.from("social-media").remove([objectPath]);
      setMessage(assetError.message);
      setBusy(false);
      return;
    }

    setMessage("Média ajouté à la bibliothèque.");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="media-uploader">
      <label className="secondary-button upload-button">
        {busy ? "Envoi…" : "Ajouter une photo ou vidéo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
