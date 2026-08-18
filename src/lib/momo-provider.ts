export type MoMoProvider = "mtn" | "moov" | "celtiis";

export function detectMomoProvider(phoneRaw: string): MoMoProvider {
  const digits = phoneRaw.replace(/\D/g, "");
  const num = digits.startsWith("229") ? digits.slice(3) : digits;
  const prefix2 = num.slice(0, 2);

  // MTN Bénin : 61, 62, 66, 67, 69, 96, 97, 51, 52, 53, 54
  if (
    ["61", "62", "66", "67", "69", "96", "97", "51", "52", "53", "54", "44", "45"].includes(prefix2)
  ) {
    return "mtn";
  }
  // Moov Money Bénin : 94, 95, 60, 63, 64, 65, 68
  if (["94", "95", "60", "63", "64", "65", "68", "55", "56"].includes(prefix2)) {
    return "moov";
  }
  // Celtiis Cash : 40, 41, 42, 43, 90, 91, 92, 93
  return "celtiis";
}
