import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, User, Wrench } from "lucide-react";

interface ChatMessage {
  id: string;
  reservation_id: string;
  sender_id: string;
  sender_type: "customer" | "staff";
  content: string;
  read_at: string | null;
  created_at: string;
}

export function AdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      reservation_id: "demo-1",
      sender_id: "admin",
      sender_type: "staff",
      content: input.trim(),
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <MessageSquare className="size-5" /> Messages clients
      </h3>

      <div className="rounded-lg border bg-card h-80 flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Aucun message</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender_type === "staff" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start gap-1.5 max-w-[70%] ${m.sender_type === "staff" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex size-6 items-center justify-center rounded-full ${m.sender_type === "staff" ? "bg-primary/10 text-primary" : "bg-muted"}`}
                  >
                    {m.sender_type === "staff" ? (
                      <Wrench className="size-3" />
                    ) : (
                      <User className="size-3" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-xs ${m.sender_type === "staff" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Votre réponse..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button size="sm" onClick={handleSend}>
            <Send className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
