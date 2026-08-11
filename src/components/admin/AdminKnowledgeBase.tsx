import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import {
  getKBArticles,
  createKBArticle,
  updateKBArticle,
  deleteKBArticle,
  searchKB,
  KB_CATEGORIES,
  type KBArticle,
} from "@/lib/knowledge-base";
import { BookOpen, Plus, Pencil, Trash2, Check, X, Search, Eye, ThumbsUp } from "lucide-react";
import { field } from "@/components/admin/primitives/AdminField";

export function AdminKnowledgeBase() {
  const { t } = useI18n();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    category: "Diagnostic",
    content: "",
    tags: "",
    author: "admin",
  });

  const load = async () => {
    setLoading(true);
    try {
      setArticles(await getKBArticles());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      load();
      return;
    }
    const results = await searchKB({ data: { query: searchQuery } });
    setArticles(results);
  };

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    await createKBArticle({
      data: {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      } as never,
    });
    setShowNew(false);
    setForm({ title: "", category: "Diagnostic", content: "", tags: "", author: "admin" });
    load();
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await updateKBArticle({
      data: {
        id: editingId,
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
    });
    setEditingId(null);
    setForm({ title: "", category: "Diagnostic", content: "", tags: "", author: "admin" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.kb.confirmDelete"))) return;
    await deleteKBArticle({ data: { id } });
    load();
  };

  const filtered = selectedCategory
    ? articles.filter((a) => a.category === selectedCategory)
    : articles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="size-5" /> Knowledge base
        </h3>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-1 size-3" /> {t("admin.catalog.button.add")}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search..."
            className={`${field} flex-1`}
          />
          <Button size="sm" variant="outline" onClick={handleSearch}>
            <Search className="size-3" />
          </Button>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={field}
        >
          <option value="">{t("admin.kb.allCategories")}</option>
          {KB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {(showNew || editingId) && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t("admin.kb.form.title")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={field}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={field}
            >
              {KB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder={t("admin.kb.form.content")}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            className={`${field} w-full`}
          />
          <input
            placeholder={t("admin.kb.form.tagsPlaceholder")}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className={`${field} w-full`}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={editingId ? handleUpdate : handleCreate}>
              <Check className="mr-1 size-3" /> {editingId ? t("admin.webhooks.form.save") : t("admin.webhooks.form.save")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowNew(false);
                setEditingId(null);
                setForm({
                  title: "",
                  category: "Diagnostic",
                  content: "",
                  tags: "",
                  author: "admin",
                });
              }}
            >
              <X className="mr-1 size-3" /> {t("admin.webhooks.form.cancel")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("admin.kb.empty")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {a.category}
                    </span>
                    <h4 className="text-sm font-bold">{a.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="size-2" /> {a.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="size-2" /> {a.helpful}
                    </span>
                    <span>{new Date(a.updated_at).toLocaleDateString("fr-BJ")}</span>
                  </div>
                  {a.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.tags.map((tag) => (
                        <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(a.id);
                      setForm({
                        title: a.title,
                        category: a.category,
                        content: a.content,
                        tags: a.tags.join(", "),
                        author: a.author,
                      });
                      setShowNew(true);
                    }}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
