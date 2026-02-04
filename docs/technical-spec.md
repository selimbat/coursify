# Coursify — Spécification technique (V1)

> Document dérivé du PRD. Objectif : décrire l’architecture, les règles métier, les flux, et fournir une roadmap en stories développeur.

## 1. Résumé du produit
Application web personnelle pour deux utilisateurs (couple) permettant de gérer des listes de courses partagées. L’usage principal est mobile en magasin, avec un fonctionnement hors ligne pour lire et cocher des items. L’édition se fait en Markdown unique, avec rendu lisible.

Priorités : simplicité, maintenabilité, robustesse hors ligne.

## 2. Stack & architecture
- Frontend / Backend : SvelteKit (monolithe)
- Base de données : PostgreSQL (local / auto‑hébergé)
- PWA : cache offline + mode lecture/édition simple
- Synchronisation : à l’ouverture ou à l’enregistrement
- Résolution de conflits : last write wins

### 2.1. Architecture logique
- Client Web (PWA)
  - UI mobile-first
  - Éditeur Markdown + rendu
  - Stockage local (offline)
- Serveur SvelteKit (API interne)
  - Auth minimale via phrase secrète
  - CRUD listes
  - Synchronisation
- DB PostgreSQL
  - Stockage des listes et métadonnées

## 3. Modèle de données
### 3.1. Entités
**List**
- id (UUID)
- title (string)
- status (enum: en_cours, en_attente, faite)
- markdown (text)
- is_template (boolean)
- created_at (timestamp nullable pour template)
- updated_at (timestamp)
- last_modified_by (enum: user_a, user_b)

**Settings / Auth**
- shared_passphrase_hash (text)

### 3.2. Règles métiers clés
- Une seule liste template (is_template = true)
- Le template n’a pas de date de création affichée
- Les listes “classiques” ont un titre + date + statut

## 4. Markdown & rendu
### 4.1. Format
- Le Markdown est le format unique de stockage.
- L’UI propose :
  - un grand champ texte éditable
  - un rendu lisible synchronisé

### 4.2. Checkboxes
- Syntaxe standard Markdown :
  - [ ] item
  - [x] item
- Quand un item est coché :
  - il reste à la même position
  - il est affiché barré (strikethrough)
- Aucun déplacement automatique des items

## 5. Création de nouvelle liste
À la création :
1) Copier le contenu de la liste template
2) Récupérer les items non cochés de la dernière liste de courses
3) Ajouter ces items à la fin dans une section :

## Pas achetés la dernière fois
- [ ] Item non acheté

Notes :
- “Dernière liste de courses” = dernière liste non‑template triée par date de création
- Ne copier que les items non cochés ([- [ ]])

## 6. Authentification
- Accès via phrase secrète partagée
- La phrase est hashée et stockée côté serveur
- Les deux utilisateurs utilisent la même phrase
- L’interface permet de choisir l’utilisateur actif : User A / User B

## 7. Offline & synchronisation
### 7.1. Offline
- Mode lecture + coche disponible hors ligne
- Les modifications locales sont conservées jusqu’à synchronisation

### 7.2. Sync
- Synchronisation déclenchée :
  - à l’ouverture de l’app
  - à l’enregistrement explicite
- Stratégie conflits : last write wins

### 7.3. Stockage local
- Stockage local minimal (ex: IndexedDB)
- Contenu Markdown et métadonnées nécessaires au rendu offline

## 8. UX / UI
- Mobile‑first, utilisable à une main
- Interface volontairement simple, peu de boutons
- Édition rapide (pas de formulaires item par item)
- Sections libres via titres Markdown (##)

## 9. Roadmap — Stories développeur
Chaque story est petite, testable, et livrable indépendamment.

### 9.1. Base technique
**Story 1 — Initialiser SvelteKit + PostgreSQL local**
- **Critères d’acceptation**
  - Un projet SvelteKit monolithique démarre en local.
  - La base PostgreSQL locale est joignable depuis l’app.
  - Un guide README couvre installation et démarrage.
- **Plan d’exécution**
  1. Initialiser SvelteKit avec TypeScript et configuration standard.
  2. Ajouter la configuration DB locale (env + connexion).
  3. Documenter les étapes de setup dans le README.

**Story 2 — Migrations DB (lists + auth)**
- **Critères d’acceptation**
  - Une migration crée la table `lists` avec les champs requis.
  - Une migration crée le stockage de la phrase secrète hashée.
  - Les migrations s’exécutent en local sans erreur.
- **Plan d’exécution**
  1. Choisir un outil de migration compatible SvelteKit.
  2. Définir le schéma `lists` et `settings/auth`.
  3. Tester la création du schéma en local.

### 9.2. Auth minimale
**Story 3 — Accès par phrase secrète**
- **Critères d’acceptation**
  - Un écran de saisie de phrase secrète est disponible.
  - Une phrase valide ouvre l’app, une invalide affiche une erreur.
  - La phrase n’est jamais stockée en clair côté client.
- **Plan d’exécution**
  1. Créer l’écran de login minimal.
  2. Implémenter l’endpoint de vérification.
  3. Gérer les erreurs et la persistance de session.

**Story 4 — Choix de l’identité active**
- **Critères d’acceptation**
  - L’utilisateur peut sélectionner User A ou User B.
  - Le choix est visible dans l’UI.
  - Le choix est persistant entre deux sessions.
- **Plan d’exécution**
  1. Ajouter un sélecteur d’identité simple.
  2. Stocker le choix localement.
  3. Relier le choix aux métadonnées d’édition.

**Story 5 — Hash + validation des sessions**
- **Critères d’acceptation**
  - La phrase secrète est stockée hashée côté serveur.
  - Une session valide persiste après rafraîchissement.
  - Un accès non authentifié redirige vers le login.
- **Plan d’exécution**
  1. Implémenter le hash serveur et la vérification.
  2. Créer la gestion de session (cookie sécurisé).
  3. Protéger les routes et endpoints API.

### 9.3. Listes — CRUD de base
**Story 6 — Liste des listes**
- **Critères d’acceptation**
  - L’écran affiche titre, statut et date pour chaque liste.
  - Les listes sont triées par date de création décroissante.
  - Le template n’affiche pas de date.
- **Plan d’exécution**
  1. Créer l’endpoint de listing.
  2. Construire la page liste avec layout mobile.
  3. Appliquer les règles d’affichage du template.

**Story 7 — Créer une liste vide**
- **Critères d’acceptation**
  - Un bouton crée une nouvelle liste vide.
  - La nouvelle liste est visible immédiatement dans la liste.
  - Les champs par défaut sont cohérents (statut, titre).
- **Plan d’exécution**
  1. Ajouter l’endpoint de création.
  2. Définir les valeurs par défaut côté serveur.
  3. Mettre à jour l’UI après création.

**Story 8 — Éditer titre et statut**
- **Critères d’acceptation**
  - Le titre et le statut sont modifiables.
  - Les changements sont persistés en DB.
  - L’UI reflète l’état sauvegardé après rechargement.
- **Plan d’exécution**
  1. Ajouter l’UI d’édition pour titre/statut.
  2. Implémenter l’endpoint d’update.
  3. Tester persistance et rechargement.

**Story 9 — Supprimer une liste**
- **Critères d’acceptation**
  - Une action de suppression est disponible.
  - La liste est supprimée en DB et de l’UI.
  - Une confirmation évite la suppression accidentelle.
- **Plan d’exécution**
  1. Ajouter l’endpoint de suppression.
  2. Ajouter la confirmation UI.
  3. Rafraîchir la liste après suppression.

### 9.4. Markdown — édition & rendu
**Story 10 — Édition Markdown**
- **Critères d’acceptation**
  - Un champ texte permet d’éditer le Markdown complet.
  - Le contenu est enregistré sans transformation.
  - Les changements sont sauvegardés explicitement.
- **Plan d’exécution**
  1. Ajouter le champ d’édition multi-ligne.
  2. Relier l’état local au modèle `markdown`.
  3. Implémenter la sauvegarde côté serveur.

**Story 11 — Rendu Markdown synchronisé**
- **Critères d’acceptation**
  - Le rendu est visible à côté ou en dessous de l’éditeur.
  - Le rendu se met à jour lors des modifications.
  - Le rendu reste lisible sur mobile.
- **Plan d’exécution**
  1. Choisir un renderer Markdown compatible.
  2. Afficher le rendu en temps quasi réel.
  3. Ajuster le layout mobile-first.

**Story 12 — Checkboxes sans déplacement**
- **Critères d’acceptation**
  - Cocher/décocher garde l’ordre des items.
  - Les items cochés sont affichés barrés.
  - Le Markdown sauvegardé reflète l’état des cases.
- **Plan d’exécution**
  1. Supporter la syntaxe `[ ]` / `[x]` dans le renderer.
  2. Gérer le toggle d’une ligne sans réordonner.
  3. Mettre à jour le texte Markdown source.

### 9.5. Template & création avancée
**Story 13 — Éditer la liste template**
- **Critères d’acceptation**
  - Le template s’édite comme une liste normale.
  - `is_template = true` est conservé.
  - Le template n’affiche pas de date.
- **Plan d’exécution**
  1. Autoriser l’accès au template depuis l’UI.
  2. Appliquer les règles d’affichage spécifiques.
  3. Vérifier la persistance `is_template`.

**Story 14 — Créer à partir du template**
- **Critères d’acceptation**
  - Une nouvelle liste copie le Markdown du template.
  - Le titre/statut par défaut sont appliqués.
  - La liste créée est persistée en DB.
- **Plan d’exécution**
  1. Ajouter un endpoint “create from template”.
  2. Copier le Markdown du template côté serveur.
  3. Mettre à jour l’UI après création.

**Story 15 — Ajouter “Pas achetés la dernière fois”**
- **Critères d’acceptation**
  - Les items non cochés de la dernière liste sont ajoutés.
  - La section “Pas achetés la dernière fois” est créée si absente.
  - Les items copiés conservent leur texte original.
- **Plan d’exécution**
  1. Identifier la dernière liste non-template.
  2. Extraire les items non cochés via parsing Markdown.
  3. Appendre la section et sauvegarder le Markdown.

### 9.6. Offline & sync
**Story 16 — Consultation hors ligne**
- **Critères d’acceptation**
  - Les listes déjà consultées restent visibles sans réseau.
  - L’app indique l’état hors ligne.
  - Aucune erreur bloquante n’apparaît hors ligne.
- **Plan d’exécution**
  1. Mettre en cache l’UI et les données essentielles.
  2. Ajouter un indicateur d’état réseau.
  3. Gérer les erreurs réseau de façon non bloquante.

**Story 17 — Cocher/décocher hors ligne**
- **Critères d’acceptation**
  - Les changements de checkbox sont possibles hors ligne.
  - Les changements restent visibles localement.
  - Un indicateur “modifications en attente” est affiché.
- **Plan d’exécution**
  1. Autoriser l’édition locale en mode offline.
  2. Stocker les modifications localement.
  3. Mettre à jour l’UI d’état.

**Story 18 — Persistance locale des modifications**
- **Critères d’acceptation**
  - Les modifications offline survivent à un refresh.
  - Les données locales incluent Markdown + métadonnées.
  - Un mécanisme de reprise est documenté.
- **Plan d’exécution**
  1. Implémenter le stockage local (IndexedDB).
  2. Sérialiser les données nécessaires.
  3. Restaurer l’état local au chargement.

**Story 19 — Sync à l’ouverture**
- **Critères d’acceptation**
  - Au démarrage, l’app tente une synchronisation.
  - Les données locales et serveur sont alignées.
  - Les erreurs de sync sont visibles mais non bloquantes.
- **Plan d’exécution**
  1. Déclencher la sync au chargement.
  2. Comparer versions et appliquer la stratégie.
  3. Gérer erreurs et statut de sync.

**Story 20 — Sync à l’enregistrement**
- **Critères d’acceptation**
  - Une action d’enregistrement déclenche la sync.
  - La sync respecte la stratégie last write wins.
  - Un feedback utilisateur confirme la sauvegarde.
- **Plan d’exécution**
  1. Ajouter un bouton “Enregistrer”.
  2. Déclencher la sync serveur à l’action.
  3. Afficher un état de réussite/échec.

**Story 21 — Résolution de conflits LWW**
- **Critères d’acceptation**
  - En conflit, la dernière modification l’emporte.
  - Le champ `updated_at` pilote la résolution.
  - Le comportement est documenté.
- **Plan d’exécution**
  1. Définir la logique LWW côté serveur.
  2. Utiliser `updated_at` pour arbitrer.
  3. Documenter et tester les cas simples.

### 9.7. UX mobile
**Story 22 — Utilisable à une main**
- **Critères d’acceptation**
  - Les actions clés sont atteignables avec le pouce.
  - Les zones tactiles respectent un minimum de taille.
  - Aucune action critique n’est cachée derrière un menu profond.
- **Plan d’exécution**
  1. Définir une grille mobile-first.
  2. Placer les actions primaires en bas.
  3. Tester sur viewport mobile.

**Story 23 — Actions essentielles accessibles**
- **Critères d’acceptation**
  - Créer, éditer, sauvegarder et supprimer sont visibles.
  - L’UI reste minimaliste (pas de menus complexes).
  - Les actions ont un feedback clair.
- **Plan d’exécution**
  1. Mapper les actions essentielles.
  2. Simplifier la navigation.
  3. Ajouter feedback visuel pour chaque action.

## 10. Hors scope confirmé
- Notifications
- Collaboration temps réel
- Recherche / tri / catégories automatiques
- Multi‑utilisateurs
- Internationalisation
