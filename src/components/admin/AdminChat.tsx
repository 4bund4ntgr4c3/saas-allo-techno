import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Send, User, Wrench, Search, MessageSquare, ExternalLink, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import {
  getChatMessages,
  sendChatMessage,
  markMessagesRead,
  type ChatMessage,
} from "@/lib/chat.functions";

interface ReservationConversation {
  id: string;
  reference: string;
  customer_name: string;
  device: string;
  phone: string;
  status: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export function AdminChat() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getMessagesFn = useServerFn(getChatMessages);
  const sendMessageFn = useServerFn(sendChatMessage);
  const markReadFn = useServerFn(markMessagesRead);

  // Fetch recent active reservations to show in conversation list
  const reservationsQuery = useQuery({
    queryKey: ["admin-chat-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, reference, customer_name, device, phone, status, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as ReservationConversation[];
    },
  });

  // Select first conversation by default once loaded
  useEffect(() => {
    const first = reservationsQuery.data?.[0];
    if (!selectedResId && first) {
      setSelectedResId(first.id);
    }
  }, [reservationsQuery.data, selectedResId]);

  // Messages of the selected conversation
  const messagesQuery = useQuery({
    queryKey: ["chat-messages", selectedResId],
    enabled: !!selectedResId,
    queryFn: async () => {
      if (!selectedResId) return [];
      return await getMessagesFn({ data: { reservation_id: selectedResId } });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  // Real-time subscription to chat_messages
  useEffect(() => {
    if (!selectedResId) return;

    // Mark messages read by staff
    markReadFn({ data: { reservation_id: selectedResId, reader_type: "staff" } }).catch(() => {});

    const channel = supabase
      .channel(`chat-realtime-${selectedResId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `reservation_id=eq.${selectedResId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedResId] });
          markReadFn({ data: { reservation_id: selectedResId, reader_type: "staff" } }).catch(
            () => {},
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedResId, queryClient, markReadFn]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedResId || !content.trim()) return;
      return await sendMessageFn({
        data: {
          reservation_id: selectedResId,
          content: content.trim(),
        },
      });
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedResId] });
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(input);
  };

  const filteredConversations = (reservationsQuery.data ?? []).filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.reference.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.device.toLowerCase().includes(q) ||
      r.phone.includes(q)
    );
  });

  const selectedRes = reservationsQuery.data?.find((r) => r.id === selectedResId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.chat.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.chat.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.chat.description")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-border bg-card overflow-hidden h-[600px]">
        {/* Sidebar Conversations */}
        <div className="md:col-span-4 border-r border-border flex flex-col h-full bg-muted/20">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${field} pl-8 py-1.5 text-xs w-full`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {reservationsQuery.isLoading ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                Chargement des dossiers...
              </p>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">Aucun dossier trouvé</p>
            ) : (
              filteredConversations.map((r) => {
                const isSelected = r.id === selectedResId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedResId(r.id)}
                    className={`w-full text-left p-3 transition-colors hover:bg-muted/50 flex flex-col gap-1 ${
                      isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">
                        {r.reference}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">
                      {r.customer_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.device}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Main Area */}
        <div className="md:col-span-8 flex flex-col h-full">
          {selectedRes ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {selectedRes.reference}
                    </span>
                    <span className="text-xs font-semibold">{selectedRes.customer_name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedRes.device} • {selectedRes.phone}
                  </p>
                </div>
                <Link
                  to="/admin/dossiers"
                  search={{ search: selectedRes.reference } as never}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 border border-border"
                >
                  <span>Dossier</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                {messagesQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Chargement des messages...
                  </p>
                ) : (messagesQuery.data ?? []).length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <MessageSquare className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">
                      Aucun message échangé sur ce dossier.
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Envoyez le premier message au client ci-dessous.
                    </p>
                  </div>
                ) : (
                  (messagesQuery.data ?? []).map((m: ChatMessage) => {
                    const isStaff = m.sender_type === "staff";
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 ${isStaff ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-end gap-1.5 max-w-[75%] ${isStaff ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`flex size-6 shrink-0 items-center justify-center text-[10px] ${
                              isStaff
                                ? "bg-primary text-primary-foreground font-bold"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {isStaff ? <Wrench className="size-3" /> : <User className="size-3" />}
                          </div>
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                              isStaff
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-card border border-border text-foreground rounded-bl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-70">
                              <span>
                                {m.created_at
                                  ? new Date(m.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                              {isStaff && <CheckCheck className="size-2.5" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="border-t border-border p-3 bg-card flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Écrivez un message au client..."
                  className={`${field} flex-1 text-xs`}
                  disabled={sendMutation.isPending}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                >
                  <Send className="size-3 mr-1" />
                  <span>Envoyer</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
              <MessageSquare className="size-10 mb-2 opacity-30" />
              <p className="text-sm">Sélectionnez une conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
