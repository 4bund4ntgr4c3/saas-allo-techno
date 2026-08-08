import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "push.enable": "Activer les notifications",
  "push.enabled": "Notifications activées",
  "push.disabled": "Notifications désactivées",
  "push.denied": "Notifications bloquées par le navigateur",
};

const en = {
  "push.enable": "Enable notifications",
  "push.enabled": "Notifications enabled",
  "push.disabled": "Notifications disabled",
  "push.denied": "Notifications blocked by browser",
};

registerSegments({ fr, en });
