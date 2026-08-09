import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface ChatMessage {
  id: string;
  reservation_id: string;
  sender_id: string;
  sender_type: "customer" | "staff";
  content: string;
  read_at: string | null;
  created_at: string;
}

export const getChatMessages = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { reservation_id } = data as { reservation_id: string };
    return { reservation_id };
  })
  .handler(async ({ data }) => {
    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages" as never)
      .select("*")
      .eq("reservation_id", data.reservation_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (messages ?? []) as unknown as ChatMessage[];
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { reservation_id, sender_id, sender_type, content } = data as {
      reservation_id: string;
      sender_id: string;
      sender_type: "customer" | "staff";
      content: string;
    };
    if (!content.trim()) throw new Error("Message vide");
    return { reservation_id, sender_id, sender_type, content: content.trim() };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("chat_messages" as never).insert({
      reservation_id: data.reservation_id,
      sender_id: data.sender_id,
      sender_type: data.sender_type,
      content: data.content,
    } as never);
    if (error) throw new Error(error.message);
    return { sent: true };
  });

export const markMessagesRead = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { reservation_id, reader_type } = data as {
      reservation_id: string;
      reader_type: "customer" | "staff";
    };
    return { reservation_id, reader_type };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("chat_messages" as never)
      .update({ read_at: new Date().toISOString() } as never)
      .eq("reservation_id", data.reservation_id)
      .neq("sender_type", data.reader_type)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { marked: true };
  });
