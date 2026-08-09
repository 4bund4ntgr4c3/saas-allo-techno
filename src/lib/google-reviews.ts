export interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export interface GooglePlaceInfo {
  name: string;
  rating: number;
  total_ratings: number;
  url: string;
  reviews: GoogleReview[];
}

const PLACE_ID = process.env["GOOGLE_PLACE_ID"];
const API_KEY = process.env["GOOGLE_MAPS_API_KEY"];

export async function getGoogleReviews(): Promise<GooglePlaceInfo | null> {
  if (!PLACE_ID || !API_KEY) {
    console.warn("[google-reviews] Missing PLACE_ID or API_KEY");
    return null;
  }
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,url,reviews&reviews_sort=newest&key=${API_KEY}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "OK") return null;
    return {
      name: json.result.name,
      rating: json.result.rating,
      total_ratings: json.result.user_ratings_total,
      url: json.result.url,
      reviews: (json.result.reviews ?? []).slice(0, 5),
    };
  } catch (err) {
    console.error("[google-reviews] fetch error", err);
    return null;
  }
}
