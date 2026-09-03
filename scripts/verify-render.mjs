// Vérification visuelle du rendu (dev, SPA pur). Pilote le Chrome installé via
// playwright-core, INJECTE une session (le backend hébergé est en retard) et
// MOCKE l'API avec des données conformes aux schémas, puis capture les écrans.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3000";
const OUT = "C:/Users/hp/Documents/artf/sirh/artf-sirh/.render";
mkdirSync(OUT, { recursive: true });

const wrap = (data, extra) => ({ success: true, data, message: "ok", ...extra });

const USER = {
  id: 1, name: "Admin ARTF", email: "admin@arft.cg", agent_id: 1, is_active: true,
  roles: [{ id: 1, name: "admin", permissions: [] }, { id: 2, name: "rh", permissions: [] }],
  permissions: [
    "consulter-agents", "modifier-agents", "consulter-recrutement", "gerer-nominations",
    "consulter-salaires", "consulter-structure", "consulter-utilisateurs", "consulter-reporting",
    "consulter-conges", "creer-conges", "valider-conges",
    "consulter-absences", "creer-absences", "valider-absences",
  ].map((name) => ({ name })),
};

const AGENTS = [
  { id: 1, nom: "Nkodia", prenom: "Jean", nom_complet: "Jean Nkodia", matricule: "ARTF-001", statut: "actif" },
  { id: 2, nom: "Mabiala", prenom: "Sylvie", nom_complet: "Sylvie Mabiala", matricule: "ARTF-002", statut: "actif" },
];
const TYPES_CONGES = [
  { id: 1, nom: "Congé annuel", jours_max: 30, necessite_n1: true, necessite_rh: true, necessite_dg: false, debite_solde: true, justificatif_requis: false },
  { id: 2, nom: "Congé maladie", jours_max: 0, necessite_n1: false, necessite_rh: true, necessite_dg: false, debite_solde: false, justificatif_requis: true },
];
const DEMANDES = [
  { id: 1, agent_id: 1, agent: AGENTS[0], type_conge_id: 1, type_conge: TYPES_CONGES[0], date_debut: "2026-09-07", date_fin: "2026-09-11", nb_jours: 4, motif: "Congés annuels de septembre", statut: "soumise", statut_label: "Soumise", prochaine_etape: "valider-n1", justificatif: null },
  { id: 2, agent_id: 2, agent: AGENTS[1], type_conge_id: 2, type_conge: TYPES_CONGES[1], date_debut: "2026-08-20", date_fin: "2026-08-22", nb_jours: 3, statut: "validee_rh", statut_label: "Validée RH", prochaine_etape: null, date_validation_rh: "2026-08-19", commentaire_rh: "Accordé" },
];
const AGENT_FICHE = {
  ...AGENTS[0], genre: "M", date_naissance: "1990-05-12", email_professionnel: "j.nkodia@artf.cg",
  telephone: "+242 06 000 00 00", grade: { nom: "Attaché" }, fonction: { nom: "Analyste RH" },
  type_integration: { nom: "Recrutement" },
  informations_personnelles: { id: 1, agent_id: 1, adresse: "12 av. de la Paix", quartier: "Centre-ville", ville: "Brazzaville", code_postal: "", pays: "Congo" },
  informations_professionnelles: { id: 1, agent_id: 1, diplome: { id: 1, nom: "Master" }, niveau_etude: "Bac+5", specialite: "Informatique de gestion", annees_experience: 5, etablissement: "UMNG" },
  situation_familiale: { id: 1, agent_id: 1, statut_matrimonial: "marie", nb_enfants: 2 },
  contacts_urgence: [{ id: 1, agent_id: 1, nom: "Nkodia", prenom: "Marie", telephone: "+242 06 111 11 11", relation: "Épouse" }],
  documents: [{ id: 1, agent_id: 1, type_document: { id: 1, nom: "Pièce d'identité" }, titre: "CNI Jean", sous_dossier: "general", nom_original: "cni.pdf", taille: 204800 }],
};

function bodyFor(url, method) {
  const p = new URL(url).pathname.replace(/^\/api/, "");
  if (p === "/login" && method === "POST") return wrap({ token: "fake-token", user: USER });
  if (p === "/user") return wrap(USER);
  if (p.startsWith("/notifications")) {
    if (method !== "GET") return wrap({});
    return wrap([
      { id: "n1", domaine: "conge", action: "validee_rh", message: "Votre congé annuel a été validé par la RH.", lu: false, created_at: "2026-09-02T09:00:00Z", data: {} },
      { id: "n2", domaine: "integration", action: "validee_rh", message: "Un dossier d'intégration attend votre validation.", lu: true, created_at: "2026-09-01T14:30:00Z", data: { dossier_id: 5 } },
    ], { meta: { current_page: 1, last_page: 1, per_page: 10, total: 2, non_lues: 1 } });
  }
  if (p === "/types-conges") return wrap(TYPES_CONGES);
  if (p === "/types-absences") return wrap([{ id: 1, nom: "Mission", justification_requise: false }, { id: 2, nom: "Maladie", justification_requise: true }]);
  if (p === "/types-documents") return wrap([{ id: 1, nom: "Pièce d'identité" }, { id: 2, nom: "Diplôme" }]);
  if (p === "/diplomes") return wrap([{ id: 1, nom: "Master" }, { id: 2, nom: "Licence" }]);
  if (/\/conges\/demandes\/1$/.test(p)) return wrap(DEMANDES[0]);
  if (p.includes("/conges/demandes") || /\/conges\/agents\/\d+\/demandes/.test(p)) return wrap(DEMANDES);
  if (p === "/conges/soldes") return wrap([{ id: 1, agent_id: 1, type_conge_id: 1, type_conge: TYPES_CONGES[0], annee: 2026, solde_initial: 30, solde_actuel: 27 }]);
  if (p === "/conges/statistiques") return wrap({ total: 12, par_statut: { soumise: 3, validee_rh: 5 }, jours_accordes: 40 });
  if (p === "/conges/jours-feries") return wrap([{ id: 1, nom: "Fête nationale", date: "2026-08-15", recurrent: true }]);
  if (p === "/conges/regles-acquisition") return wrap([{ id: 1, type_conge_id: 1, type_conge: TYPES_CONGES[0], jours_par_mois: 2.5, jours_max: 30 }]);
  if (p.includes("/absences")) return wrap([{ id: 1, agent_id: 1, agent: AGENTS[0], type_absence_id: 1, type_absence: { nom: "Mission" }, date_debut: "2026-09-01", date_fin: "2026-09-02", nb_jours: 2, justifiee: true, statut: "en_attente", statut_label: "En attente" }]);
  if (/\/personnel\/agents\/1$/.test(p)) return wrap(AGENT_FICHE);
  if (/\/carriere\/agents\/1$/.test(p)) return wrap({ id: 1, affectation_active: null, nomination_active: null, contrat_actif: null, salaire_actuel: null });
  if (p === "/integration/agents" || p === "/personnel/agents") return wrap(AGENTS);
  return method === "GET" ? wrap([]) : wrap({});
}

const shots = [];
async function shot(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  shots.push(name);
  console.log("shot:", name);
}

// goto robuste : réessaie sur écran vide (recompilation Vite à froid).
async function open(page, path, name, waitSel) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.goto(BASE + path, { waitUntil: "commit" }).catch(() => {});
    try {
      await page.waitForSelector(waitSel || "header", { timeout: 12000 });
      await page.waitForTimeout(1200);
      const len = await page.evaluate(() => document.body.innerText.length).catch(() => 0);
      if (len > 25) break;
    } catch { /* recompilation en cours → on réessaie */ }
    await page.waitForTimeout(1500);
  }
  if (name) await shot(page, name);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
// ⚠️ Matcher UNIQUEMENT les vrais appels HTTP (`/api/...`), pas les modules Vite
// `/_nuxt/.../app/api/*.ts` (dont le chemin contient aussi « /api/ »).
await context.route(
  (url) => url.pathname.startsWith("/api/"),
  (route) => {
    const req = route.request();
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bodyFor(req.url(), req.method())) });
  },
);
const page = await context.newPage();

try {
  // Connexion réelle via l'UI (login mocké) : l'app persiste elle-même la session
  // (cookie/localStorage selon sa config) → les navigations directes suivantes la relisent.
  await open(page, "/login", "01-login", 'input[type="email"]');
  await page.fill('input[type="email"]', "admin@arft.cg");
  await page.fill('input[type="password"]', "Admin@2026");
  await page.click('button[type="submit"]');
  await page.waitForSelector('a[href="/conges/demandes"]', { timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot(page, "02-accueil");

  // Cloche de notifications
  try {
    await page.click('button[aria-label^="Notifications"]');
    await page.waitForTimeout(600);
    await shot(page, "03-cloche-notifications");
    await page.keyboard.press("Escape");
  } catch (e) { console.log("cloche:", e.message); }

  await open(page, "/conges/demandes", "04-conges-demandes", "table");
  await open(page, "/conges/demandes/1", "05-conge-detail-circuit", "text=Circuit de validation");
  await open(page, "/conges/soldes", "06-conges-soldes", "table");
  await open(page, "/conges/absences", "07-conges-absences", "table");
  await open(page, "/conges/parametrage", "08-conges-parametrage", "text=Jours fériés");

  // Modale « Nouvelle demande »
  try {
    await open(page, "/conges/demandes", null, "table");
    await page.click('button:has-text("Nouvelle demande")');
    await page.waitForTimeout(700);
    await shot(page, "09-conge-modale-creation");
    await page.keyboard.press("Escape");
  } catch (e) { console.log("modale:", e.message); }

  // Fiche agent — vie courante + documents
  await open(page, "/personnel/agents/1", "10-fiche-agent", "text=Jean Nkodia");
  try {
    await page.click('text="Dossier (vie courante)"');
    await page.waitForTimeout(800);
    await shot(page, "11-fiche-vie-courante");
    await page.click('text="Documents"');
    await page.waitForTimeout(800);
    await shot(page, "12-fiche-documents");
  } catch (e) { console.log("fiche:", e.message); }

  console.log("\nRESULT OK — " + shots.length + " captures : " + shots.join(", "));
} catch (err) {
  console.error("FAIL:", err.message);
} finally {
  await browser.close();
}
