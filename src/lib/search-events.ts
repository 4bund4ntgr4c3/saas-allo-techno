export const SEARCH_OPEN_EVENT = "at:open-search";

export const openSearch = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SEARCH_OPEN_EVENT));
};
