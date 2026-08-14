/**
 * Centralized error parsing and mapping utility.
 * Sanitizes backend / Supabase / network errors to prevent leaking database
 * implementation details and provides user-friendly localized messages.
 */

export interface ParsedError {
  message: string;
  code?: string | undefined;
  isNetworkError?: boolean | undefined;
}

export function parseError(
  err: unknown,
  fallbackMessage = "Une erreur inattendue est survenue. Veuillez réessayer."
): ParsedError {
  if (!err) {
    return { message: fallbackMessage };
  }

  // If already a standard string
  if (typeof err === "string") {
    return { message: mapRawMessage(err, fallbackMessage) };
  }

  // If standard Error object or Supabase PostgrestError
  if (typeof err === "object" && err !== null) {
    const anyErr = err as Record<string, unknown>;
    const rawMessage = typeof anyErr["message"] === "string" ? (anyErr["message"] as string) : "";
    const code = typeof anyErr["code"] === "string" ? (anyErr["code"] as string) : undefined;

    // Detect network / connectivity errors
    if (
      rawMessage.includes("Failed to fetch") ||
      rawMessage.includes("NetworkError") ||
      rawMessage.includes("Network request failed")
    ) {
      return {
        message: "Connexion réseau instable ou interrompue. Vérifiez votre connexion Internet.",
        code: "NETWORK_ERROR",
        isNetworkError: true,
      };
    }

    // Detect PostgreSQL / Supabase constraint violations
    if (code === "23505" || rawMessage.includes("duplicate key value")) {
      return {
        message: "Cet enregistrement existe déjà dans le système.",
        code: "DUPLICATE_ENTRY",
      };
    }

    if (code === "23503" || rawMessage.includes("foreign key constraint")) {
      return {
        message: "L'élément lié est introuvable ou a été supprimé.",
        code: "FOREIGN_KEY_VIOLATION",
      };
    }

    if (code === "42501" || rawMessage.includes("row-level security")) {
      return {
        message: "Vous n'avez pas les autorisations requises pour effectuer cette action.",
        code: "FORBIDDEN",
      };
    }

    if (rawMessage.includes("JWT") || rawMessage.includes("Invalid login credentials")) {
      return {
        message: "Identifiants invalides ou session expirée. Veuillez vous reconnecter.",
        code: "AUTH_ERROR",
      };
    }

    if (rawMessage.includes("rate limit") || rawMessage.includes("Trop de requêtes")) {
      return {
        message: "Trop de requêtes effectuées. Veuillez patienter un instant avant de réessayer.",
        code: "RATE_LIMITED",
      };
    }

    if (rawMessage) {
      return { message: mapRawMessage(rawMessage, fallbackMessage), ...(code ? { code } : {}) };
    }
  }

  return { message: fallbackMessage };
}

function mapRawMessage(msg: string, fallback: string): string {
  const trimmed = msg.trim();
  if (!trimmed) return fallback;

  // Mask database schema or stack trace details if any leaked
  if (
    trimmed.includes("select ") ||
    trimmed.includes("insert into") ||
    trimmed.includes("update ") ||
    trimmed.includes("null value in column") ||
    trimmed.includes("syntax error at or near")
  ) {
    return "Données invalides ou opération non conforme. Veuillez vérifier vos saisies.";
  }

  return trimmed;
}
