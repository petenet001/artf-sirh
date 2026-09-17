// Personnalisation du thème Nuxt UI : design « épuré » — rondeurs généreuses et
// ombres douces sur les cartes/éléments, badges en pilule, contrôles arrondis.
// Style des tables (en-tête discret, lignes survolées).
export default defineAppConfig({
  ui: {
    // Identité ARTF : bleu `#0F4C81` en primaire, rouge `#ed1c24` en secondaire
    // (échelles dans assets/css/main.css, déclarées en `@theme static` — sans
    // quoi Tailwind élague les nuances et le primaire devient transparent).
    // Aucune couleur de marque n'est écrite en dur ailleurs : ces trois lignes
    // repeignent toute l'application.
    colors: {
      primary: "artf",
      secondary: "artfred",
      neutral: "slate",
    },
    // Cartes : rondeurs de la maquette (12px), bordure fine + ombre douce.
    card: {
      slots: {
        root: "rounded-3xl shadow-sm ring-1 ring-default/60",
      },
    },
    // Cartes de navigation (`UPageCard`, accès rapides) : mêmes codes que les
    // autres cartes — grand rayon, bordure fine, ombre douce — et pastille
    // d'icône teintée identique à `BaseStatCard`. Elles se soulèvent au survol
    // quand elles mènent quelque part.
    pageCard: {
      slots: {
        root: "rounded-3xl shadow-sm",
        container: "p-5 sm:p-5",
        leading: "inline-flex items-center justify-center size-10 rounded-lg bg-primary/10 mb-4",
        leadingIcon: "size-5 text-primary",
        title: "text-base font-semibold text-highlighted",
        description: "text-sm text-muted",
      },
      variants: {
        to: {
          true: { root: "transition hover:-translate-y-0.5 hover:shadow-md" },
        },
      },
      defaultVariants: { variant: "outline" },
    },
    // Badges en pilule (comme les étiquettes de la maquette).
    badge: {
      slots: {
        base: "rounded-full",
      },
    },
    // Modales : mêmes rondeurs que les cartes, sans ombre (le voile suffit).
    modal: {
      slots: {
        content: "rounded-3xl shadow-none ring-default",
      },
    },
    // — Gabarit des contrôles ————————————————————————————————
    // La taille globale est `md` (nuxt.config). Boutons et champs de saisie
    // montent d'un cran (`lg`) : ce sont les deux éléments qu'on manipule le
    // plus, et en `sm` ils paraissaient étriqués. Le `py` supplémentaire leur
    // donne la hauteur confortable de la maquette sans toucher aux autres
    // composants (badges, tables, pastilles restent compacts).
    button: {
      slots: { base: "rounded-lg py-2.5 font-medium" },
      defaultVariants: { size: "lg" },
    },
    // Champs de formulaire : arrondis, plus hauts, texte légèrement plus grand.
    input: { slots: { base: "rounded-lg py-2.5" }, defaultVariants: { size: "lg" } },
    select: { slots: { base: "rounded-lg py-2.5" }, defaultVariants: { size: "lg" } },
    selectMenu: { slots: { base: "rounded-lg py-2.5" }, defaultVariants: { size: "lg" } },
    textarea: { slots: { base: "rounded-lg py-2.5" }, defaultVariants: { size: "lg" } },
    inputNumber: { slots: { base: "rounded-lg py-2.5" }, defaultVariants: { size: "lg" } },
    inputMenu: { slots: { base: "rounded-lg py-2.5" }, defaultVariants: { size: "lg" } },
    // Libellés de champ un peu plus lisibles, à l'échelle des champs.
    formField: { slots: { label: "text-sm font-medium text-highlighted" } },
    // Zones de dépôt de fichier (`UFileUpload`, via `BaseUploadZone`) : mêmes
    // rondeurs que les cartes et pastille d'icône teintée comme `BaseStatCard`.
    fileUpload: {
      slots: {
        base: "rounded-xl",
        avatar: "bg-primary/10 text-primary",
        label: "text-sm font-medium text-highlighted",
        description: "text-xs text-muted",
        file: "rounded-lg bg-default",
      },
    },
    table: {
      slots: {
        thead: "bg-elevated/40",
        th: "py-2.5 text-xs font-semibold uppercase tracking-wide text-muted",
        td: "py-2.5 text-sm text-default",
        tr: "hover:bg-elevated/30 transition-colors",
      },
    },
  },
});
