import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export type ProductReview = {
  id: string;
  product_slug: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

const reviewSchema = z.object({
  product_slug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Nom trop court.").max(80),
  rating: z.number().int().min(1, "Note minimale : 1").max(5, "Note maximale : 5"),
  text: z.string().trim().min(10, "10 caractères minimum.").max(1000),
});

export const getProductReviews = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { product_slug } = data as { product_slug: string };
    return { product_slug };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("get-product-reviews", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_reviews" as never)
      .select("*")
      .eq("product_slug", data.product_slug)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ProductReview[];
  });

export const addProductReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("product-review-add", 5))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { error } = await supabaseAdmin.from("product_reviews" as never).insert({
      product_slug: data.product_slug,
      name: data.name,
      rating: data.rating,
      text: data.text,
    } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const getProductRating = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { product_slug } = data as { product_slug: string };
    return { product_slug };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("get-product-rating", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_reviews" as never)
      .select("rating")
      .eq("product_slug", data.product_slug);
    if (error) throw new Error(error.message);
    const ratings = (rows ?? []) as { rating: number }[];
    if (ratings.length === 0) return { avg: 0, count: 0 };
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: ratings.length };
  });
