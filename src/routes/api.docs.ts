import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/docs")({
  server: {
    handlers: {
      GET: async () => {
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Allô Techno — Documentation API Webhooks</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fafafa;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .header {
      background: #0a0a0a;
      color: #fff;
      padding: 3rem 2rem;
    }
    .header-inner {
      max-width: 800px;
      margin: 0 auto;
    }
    .header h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header p {
      margin-top: 0.5rem;
      color: #a0a0a0;
      font-size: 0.875rem;
    }
    .badge {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.25rem 0.75rem;
      background: rgba(216, 49, 0, 0.15);
      color: #d83100;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-radius: 2px;
    }
    .content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e5e5;
    }
    h3 {
      font-size: 1rem;
      font-weight: 700;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p, li {
      font-size: 0.875rem;
      color: #444;
    }
    p { margin-bottom: 0.75rem; }
    ul { margin-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.25rem; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      background: #f0f0f0;
      padding: 0.15rem 0.4rem;
      border-radius: 2px;
    }
    pre {
      background: #1a1a1a;
      color: #e0e0e0;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0.75rem 0 1rem;
      font-size: 0.8rem;
      line-height: 1.5;
    }
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    .method {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 2px;
      margin-right: 0.5rem;
    }
    .method-get { background: #dbeafe; color: #1d4ed8; }
    .method-post { background: #dcfce7; color: #16a34a; }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .endpoint {
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      padding: 1.25rem;
      margin: 1rem 0;
    }
    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0;
      font-size: 0.8rem;
    }
    th, td {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .error-code { font-family: monospace; font-weight: 600; }
    .note {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 0.75rem 1rem;
      margin: 1rem 0;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <h1>Documentation API — Webhooks</h1>
      <p>Points d'entrée pour les notifications de paiement et les tâches automatisées Allô Techno.</p>
      <span class="badge">v1.0</span>
    </div>
  </div>
  <div class="content">
    <h2>Authentification</h2>
    <p>Chaque endpoint utilise un mécanisme d'authentification différent :</p>
    <ul>
      <li><strong>FedaPay webhook</strong> : Signature HMAC-SHA256 dans l'en-tête <code>X-FedaPay-Signature</code></li>
      <li><strong>KKiaPay webhook</strong> : Secret partagé dans l'en-tête <code>X-KKiaPay-Secret</code></li>
      <li><strong>Cron reminders</strong> : Jeton Bearer dans l'en-tête <code>Authorization</code></li>
    </ul>

    <h2>Endpoints</h2>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-post">POST</span>
        <span class="endpoint-path">/api/fedapay-webhook</span>
      </div>
      <p>Webhook de notification de transaction FedaPay. Vérifie la signature HMAC-SHA256 puis met à jour le statut de paiement de la réservation.</p>

      <h3>En-têtes</h3>
      <table>
        <thead><tr><th>En-tête</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>X-FedaPay-Signature</code></td><td>string</td><td>Signature au format <code>t=&lt;timestamp&gt;,s=&lt;hmac-sha256-hex&gt;</code></td></tr>
        </tbody>
      </table>

      <h3>Corps de la requête</h3>
      <pre><code>{
  "event": "transaction.approved",
  "data": {
    "id": 123456,
    "status": "approved",
    "amount": 15000,
    "reference": "AT-2026-0001"
  }
}</code></pre>

      <h3>Événements gérés</h3>
      <table>
        <thead><tr><th>Événement</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td><code>transaction.approved</code></td><td>Marque la réservation comme payée</td></tr>
          <tr><td><code>transaction.declined</code></td><td>Marque le paiement comme échoué</td></tr>
          <tr><td><code>transaction.canceled</code></td><td>Marque le paiement comme échoué</td></tr>
        </tbody>
      </table>

      <h3>Réponse</h3>
      <pre><code>{
  "status": "ok"
}</code></pre>
      <p>Codes : <span class="error-code">200</span> OK, <span class="error-code">400</span> JSON invalide, <span class="error-code">401</span> Signature invalide, <span class="error-code">500</span> Erreur serveur</p>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-post">POST</span>
        <span class="endpoint-path">/api/kkiapay-webhook</span>
      </div>
      <p>Webhook de notification de transaction KKiaPay (Mobile Money). Vérifie le secret partagé puis met à jour le statut de paiement.</p>

      <h3>En-têtes</h3>
      <table>
        <thead><tr><th>En-tête</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>X-KKiaPay-Secret</code></td><td>string</td><td>Secret partagé KKiaPay</td></tr>
        </tbody>
      </table>

      <h3>Corps de la requête</h3>
      <pre><code>{
  "transactionId": "txn_abc123",
  "isPaymentSucces": true,
  "amount": 15000,
  "method": "momo",
  "account": "+22997000000",
  "event": "payment.success"
}</code></pre>

      <h3>Événements gérés</h3>
      <table>
        <thead><tr><th>Champ</th><th>Valeur</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td><code>isPaymentSucces</code></td><td><code>true</code></td><td>Marque la réservation comme payée</td></tr>
          <tr><td><code>isPaymentSucces</code></td><td><code>false</code></td><td>Marque le paiement comme échoué</td></tr>
        </tbody>
      </table>

      <h3>Réponse</h3>
      <pre><code>{
  "status": "ok"
}</code></pre>
      <p>Codes : <span class="error-code">200</span> OK, <span class="error-code">400</span> JSON invalide, <span class="error-code">401</span> Secret invalide, <span class="error-code">500</span> Erreur serveur</p>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method method-get">POST</span>
        <span class="endpoint-path">/api/cron-reminders</span>
      </div>
      <p>Déclenche le job de rappels automatisés (cron quotidien 08:00 UTC). Envoie les rappels de rendez-vous pour les réservations à venir.</p>

      <h3>En-têtes</h3>
      <table>
        <thead><tr><th>En-tête</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>Authorization</code></td><td>string</td><td>Bearer token : <code>Bearer &lt;CRON_TOKEN&gt;</code></td></tr>
        </tbody>
      </table>

      <h3>Corps de la requête</h3>
      <p>Aucun corps requis.</p>

      <h3>Réponse</h3>
      <pre><code>{
  "sent": 12,
  "failed": 0,
  "skipped": 3
}</code></pre>
      <p>Codes : <span class="error-code">200</span> OK, <span class="error-code">401</span> Token invalide, <span class="error-code">503</span> Non configuré, <span class="error-code">500</span> Erreur serveur</p>
    </div>

    <h2>Codes d'erreur</h2>
    <table>
      <thead><tr><th>Code</th><th>Description</th></tr></thead>
      <tbody>
        <tr><td class="error-code">200</td><td>Succès — la requête a été traitée</td></tr>
        <tr><td class="error-code">400</td><td>Mauvaise requête — JSON invalide ou corps manquant</td></tr>
        <tr><td class="error-code">401</td><td>Non autorisé — signature ou token invalide</td></tr>
        <tr><td class="error-code">500</td><td>Erreur interne — problème serveur ou base de données</td></tr>
        <tr><td class="error-code">503</td><td>Service indisponible — endpoint non configuré</td></tr>
      </tbody>
    </table>

    <div class="note">
      <strong>Note :</strong> Tous les webhooks doivent recevoir une réponse 2xx dans les 5 secondes. Le traitement asynchrone (notifications email/SMS) est effectué après l'envoi de la réponse.
    </div>
  </div>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
