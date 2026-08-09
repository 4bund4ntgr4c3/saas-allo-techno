import { POSTS } from "@/data/catalog/static";
import type { Post } from "@/data/catalog/static";

export type BilingualPost = Post & {
  en?: {
    title: string;
    excerpt: string;
    body: string[];
  };
};

function postToEntry(p: Post): BilingualPost {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    category: p.category,
    readingTime: p.readingTime,
    body: p.body,
  };
}

const EN_TRANSLATIONS: Record<number, { title: string; excerpt: string; body: string[] }> = {
  0: {
    title: "7 tips to extend your smartphone battery life in Benin",
    excerpt:
      "Heat, power outages, cheap chargers: here's how to preserve your battery health in Cotonou and Abomey-Calavi.",
    body: [
      "Heat is the number one enemy of lithium-ion batteries.",
      "Avoid charging to 100% continuously: the ideal range is between 20% and 80%.",
      "Use a certified charger matched to your device's wattage.",
      "After a power outage, wait for the grid to stabilize before plugging back in.",
      "If your battery life drops suddenly, get the battery health checked.",
    ],
  },
  1: {
    title: "Cracked screen: what to do in the first hours?",
    excerpt:
      "Cracked glass, dead touchscreen, ink stains: the right reflexes before bringing your device to the workshop.",
    body: [
      "Power off the device if the display shows black spots that are spreading.",
      "Apply a clear adhesive film on the glass to prevent shards from scattering.",
      "Back up your data while the touchscreen still works.",
      "Do not attempt to disassemble it yourself.",
      "At Allô Techno, most screen replacements are done in under an hour.",
    ],
  },
  2: {
    title: "How to tell a genuine spare part from a fake?",
    excerpt:
      "Grade A+, service pack, compatible: decoding spare part categories and their impact on lifespan.",
    body: [
      "A 'service pack' part comes directly from the manufacturer.",
      "A 'grade A+' part is a high-end equivalent.",
      "'Compatible' budget parts suit entry-level devices, but their lifespan is shorter.",
      "At Allô Techno, the part category is listed on every quote and invoice.",
    ],
  },
  3: {
    title: "Getting your phone repaired in Abomey-Calavi: the complete 2026 guide",
    excerpt:
      "Average prices, turnaround times, serviced neighborhoods and questions to ask before entrusting your smartphone.",
    body: [
      "Abomey-Calavi now handles most of the smartphone repairs in the Cotonou metro area.",
      "First reflex: demand a written, free diagnostic.",
      "Price ranges observed in Abomey-Calavi in 2026: entry-level screen 25,000 to 45,000 FCFA.",
      "Second reflex: traceability. A reference number lets you track repair progress.",
      "Third reflex: turnaround times. A screen or battery replacement takes under an hour.",
      "Finally, think about backups before any drop-off.",
    ],
  },
  4: {
    title: "Broken screen in Abomey-Calavi: prices, lead times and parts in 2026",
    excerpt: "How much does a screen replacement cost in Calavi depending on the brand.",
    body: [
      "The screen remains the most-requested repair at our Abomey-Calavi workshop.",
      "On Tecno, Infinix, and Itel, the complete screen block is generally replaced for 25,000 to 45,000 FCFA.",
      "On Samsung Galaxy A and S, expect 45,000 to 110,000 FCFA depending on the AMOLED panel.",
      "A good panel can be identified by three things: maximum brightness, touch sensitivity, and absence of milky glare.",
      "Always ask for written warranty.",
    ],
  },
  5: {
    title: "Harmattan dust: protecting your phone in Calavi",
    excerpt:
      "Clogged charging port, muffled microphone, overheating console: the dry season causes damage.",
    body: [
      "During harmattan, fine dust gets everywhere: charging port, microphone grilles, console and laptop fans.",
      "Symptom #1: the cable won't stay in or charges intermittently.",
      "Symptom #2: callers can't hear you. The microphone grille is clogged.",
      "Symptom #3: the PlayStation or laptop becomes noisy and shuts off.",
      "For prevention: a case with port cover, a microfiber cloth every week.",
    ],
  },
  6: {
    title: "Paying for repairs with Mobile Money in Benin",
    excerpt: "MoMo, Celtiis Cash, cash or transfer: how to secure your repair payment.",
    body: [
      "Never pay the full amount before the diagnostic.",
      "Verify that the Mobile Money number matches the workshop's business name.",
      "Demand an invoice stating the model, the fault, the part installed, and the warranty period.",
      "Keep the SMS confirmation of the transaction.",
      "At Allô Techno, payment is made upon return, with systematic invoicing.",
    ],
  },
  7: {
    title: "PS5 overheating: diagnosis and maintenance",
    excerpt: "Dust, dried thermal paste, blocked ventilation: the complete maintenance protocol.",
    body: [
      "A console that runs loud and shuts off almost always signals a heat dissipation problem.",
      "Fine harmattan dust accumulates in the heatsink and blocks airflow within months.",
      "Complete maintenance includes disassembly, heatsink cleaning, and thermal paste replacement.",
      "Allow 24 hours at the workshop. Temperatures drop by 12 to 18°C after intervention.",
    ],
  },
  8: {
    title: "Making a proper backup before repair",
    excerpt: "Photos, WhatsApp, contacts backed up in 10 minutes before the workshop.",
    body: [
      "One in ten repairs ends with a client realizing they never backed up their phone.",
      "Enable automatic backup a few hours before drop-off.",
      "WhatsApp deserves special attention: Settings > Chats > Backup.",
      "Note down your two-factor authentication (2FA) codes.",
      "At Allô Techno, screens and batteries never touch your data.",
    ],
  },
  9: {
    title: "Changing phones: transfer your data without losing anything",
    excerpt: "Android or iPhone, photos, WhatsApp and contacts: the seamless transfer.",
    body: [
      "First gesture: plug both devices into the wall and connect them to the same Wi-Fi.",
      "On Android, each brand has its tool: Smart Switch on Samsung, etc.",
      "On iPhone, Apple's migration (Quick Start) works wirelessly.",
      "Verify the SIM card is read and a call comes through on the new number.",
      "Our workshop handles the complete cloning in about thirty minutes.",
    ],
  },
  10: {
    title: "Check your battery health yourself: our tips",
    excerpt: "Autonomy dropping, slow recharges? Learn to measure your battery's real health.",
    body: [
      "On iPhone: Settings > Battery > Battery Health.",
      "On Android, the code *#*#4636#*#* opens the diagnostic menu.",
      "When capacity drops below 85%, every discharge counts double.",
      "Unstable voltage overcharges cells. Replug after grid stabilization.",
      "Our test bench measures real capacity, internal resistance, and cycle count.",
    ],
  },
  11: {
    title: "Charging port blocked by harmattan: the DIY cleaning guide",
    excerpt: "Cable won't stay in, charging in spikes? Dry dust has crusted the USB port.",
    body: [
      "During the dry season, fine harmattan dust gets everywhere.",
      "What you should never do: blow directly into the port or jam a paperclip inside.",
      "The gentle method: cable unplugged and device off, use a very thin nylon brush.",
      "If the port remains clogged, bring it to us.",
      "For prevention: a case with a port cover during dry season.",
    ],
  },
};

const BLOG_POSTS: BilingualPost[] = POSTS.map((p, i): BilingualPost => {
  const en = EN_TRANSLATIONS[i];
  return en ? { ...postToEntry(p), en } : postToEntry(p);
});

/** Returns blog posts filtered by locale. Falls back to French if no match exists. */
export function getBlogPosts(locale: string): BilingualPost[] {
  if (locale === "en") {
    return BLOG_POSTS.filter((p) => p.en).map((p) => ({
      ...p,
      title: p.en!.title,
      excerpt: p.en!.excerpt,
      body: p.en!.body,
    }));
  }
  return BLOG_POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: p.date,
    category: p.category,
    readingTime: p.readingTime,
    body: p.body,
  }));
}

/** Returns a single blog post by slug and locale, or null if not found. */
export function getBlogPost(slug: string, locale: string): BilingualPost | null {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return null;

  if (locale === "en" && post.en) {
    return {
      ...post,
      title: post.en.title,
      excerpt: post.en.excerpt,
      body: post.en.body,
    };
  }

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    category: post.category,
    readingTime: post.readingTime,
    body: post.body,
  };
}
