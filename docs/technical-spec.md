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
1. En tant que développeur, je peux initialiser un projet SvelteKit monolithique avec PostgreSQL local.
2. En tant que développeur, je peux configurer les migrations DB pour la table `lists` et la configuration d’auth.

### 9.2. Auth minimale
3. En tant qu’utilisateur, je peux saisir la phrase secrète partagée pour accéder à l’app.
4. En tant qu’utilisateur, je peux choisir mon identité active (User A / User B).
5. En tant que système, je stocke la phrase secrète hashée et je valide les sessions.

### 9.3. Listes — CRUD de base
6. En tant qu’utilisateur, je peux voir la liste des listes avec titre, statut, date.
7. En tant qu’utilisateur, je peux créer une nouvelle liste vide.
8. En tant qu’utilisateur, je peux éditer le titre et le statut d’une liste.
9. En tant qu’utilisateur, je peux supprimer une liste.

### 9.4. Markdown — édition & rendu
10. En tant qu’utilisateur, je peux éditer le contenu Markdown dans un grand champ texte.
11. En tant qu’utilisateur, je vois un rendu lisible synchronisé du Markdown.
12. En tant qu’utilisateur, cocher/décocher un item garde sa position et l’affiche barré.

### 9.5. Template & création avancée
13. En tant qu’utilisateur, je peux éditer la liste template comme une liste normale.
14. En tant qu’utilisateur, je peux créer une nouvelle liste à partir du template.
15. En tant qu’utilisateur, les items non cochés de la dernière liste sont ajoutés dans la section “Pas achetés la dernière fois”.

### 9.6. Offline & sync
16. En tant qu’utilisateur, je peux consulter une liste hors ligne.
17. En tant qu’utilisateur, je peux cocher/décocher des items hors ligne.
18. En tant que système, les modifications offline sont conservées localement.
19. En tant que système, les données se synchronisent à l’ouverture de l’app.
20. En tant que système, les données se synchronisent à l’enregistrement.
21. En tant que système, en cas de conflit, la dernière écriture l’emporte.

### 9.7. UX mobile
22. En tant qu’utilisateur mobile, l’interface reste utilisable à une main.
23. En tant qu’utilisateur, les actions essentielles sont accessibles sans menus complexes.

## 10. Hors scope confirmé
- Notifications
- Collaboration temps réel
- Recherche / tri / catégories automatiques
- Multi‑utilisateurs
- Internationalisation

