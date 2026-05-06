import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";

const BUCKET = "asset-documents";
const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPT = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

interface DocRow {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  doc_month: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface DocumentsDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ownerType: "asset" | "order";
  ownerId: string;
  ownerLabel?: string;
  uploadedBy?: string;
}

export const DocumentsDialog = ({ open, onOpenChange, ownerType, ownerId, ownerLabel, uploadedBy }: DocumentsDialogProps) => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("asset_documents") as any)
      .select("*")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load documents");
    setDocs((data || []) as DocRow[]);
    setLoading(false);
  }, [ownerType, ownerId]);

  useEffect(() => {
    if (open) fetchDocs();
  }, [open, fetchDocs]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} exceeds 3MB`);
          continue;
        }
        if (!ACCEPT.includes(file.type)) {
          toast.error(`${file.name} unsupported type`);
          continue;
        }
        const ext = file.name.split(".").pop();
        const path = `${ownerType}/${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (upErr) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        const month = new Date().toISOString().slice(0, 7);
        const { error: insErr } = await (supabase.from("asset_documents") as any).insert({
          owner_type: ownerType,
          owner_id: ownerId,
          file_name: file.name,
          file_path: path,
          mime_type: file.type,
          file_size: file.size,
          doc_month: month,
          uploaded_by: uploadedBy || null,
        });
        if (insErr) {
          toast.error(`Save failed: ${file.name}`);
          await supabase.storage.from(BUCKET).remove([path]);
          continue;
        }
      }
      toast.success("Upload complete");
      fetchDocs();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (doc: DocRow) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 60);
    if (error || !data) return toast.error("Could not generate link");
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (doc: DocRow) => {
    if (!confirm(`Delete ${doc.file_name}?`)) return;
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
    const { error } = await (supabase.from("asset_documents") as any).delete().eq("id", doc.id);
    if (error) return toast.error("Delete failed");
    toast.success("Deleted");
    fetchDocs();
  };

  const months = Array.from(new Set(docs.map((d) => d.doc_month).filter(Boolean))) as string[];
  const visible = monthFilter === "all" ? docs : docs.filter((d) => d.doc_month === monthFilter);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Documents {ownerLabel ? `— ${ownerLabel}` : ""}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload PDF or image files (max 3MB each). No limit on number of uploads.
          </DialogDescription>
        </DialogHeader>

        <div
          className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-primary" />
          )}
          <p className="mt-2 text-sm font-medium text-foreground">Click to upload files</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP — Max 3MB each</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">View Month</span>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No documents uploaded yet</div>
          ) : (
            <ul className="divide-y">
              {visible.map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.file_size ? (d.file_size / 1024).toFixed(0) + " KB" : ""} · {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(d)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(d)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsDialog;
