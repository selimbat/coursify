# Product Requirement Document (PRD)

## 1. Contexte & objectif

Le projet consiste à créer une **application web personnelle** permettant à deux utilisateurs (un couple) de **gérer des listes de courses partagées**, de manière simple, fiable et utilisable au quotidien, notamment **sur mobile pendant les courses**.

L’objectif principal est de **centraliser l’information**, éviter les oublis (papier, messages non transmis) et permettre à chacun de contribuer librement à la liste, sans complexité inutile.

Ce projet est volontairement **minimaliste**, orienté usage réel, avec une priorité forte sur :

* la simplicité,
* la maintenabilité,
* la robustesse hors ligne.

---

## 2. Périmètre

### Inclus

* Application web responsive (mobile-first)
* Gestion de plusieurs listes
* Édition de listes via Markdown
* Fonctionnement hors ligne (lecture + coche)
* Synchronisation simple avec le serveur
* Authentification minimale (phrase secrète partagée)

### Exclu

* Notifications
* Temps réel (collaboration live)
* Recherche / tri / catégories automatiques
* Gestion de plus de deux utilisateurs
* Internationalisation (français uniquement)

---

## 3. Utilisateurs

### Profil

* **Deux utilisateurs uniques et connus à l’avance**
* Aucun besoin de gestion dynamique des comptes

### Authentification

* Accès via une **phrase secrète partagée**
* La phrase est :

  * hashée
  * stockée côté serveur
* Les deux utilisateurs utilisent la même phrase secrète
* L’application permet néanmoins de **différencier quel utilisateur est connecté** (ex : User A / User B)

---

## 4. Plateformes & usage

* **Application web**
* Design **mobile-first**, utilisable à une main
* Usage principal :

  * en magasin, téléphone à la main
  * à la maison pour préparer les listes

### Hors ligne

* Fonctionnement hors ligne requis pour :

  * lire les listes
  * cocher / décocher des éléments
* La synchronisation serveur peut se faire ultérieurement

---

## 5. Modèle de données – Listes

### Types de listes

1. **Listes classiques**

   * Ex : "Courses du 12/01", "Bricolage", "Idées"
   * Possèdent :

     * un titre
     * une date de création
     * un statut

2. **Template**

   * Liste spéciale servant de base
   * Éditable comme une liste normale
   * Pas de date
   * Utilisée lors de la création de nouvelles listes

### Statuts d’une liste

* En cours
* En attente (prochaines courses)
* Faite

---

## 6. Création d’une nouvelle liste

Lors de la création d’une nouvelle liste :

1. Le contenu du **template** est copié
2. Les éléments **non cochés** de la **dernière liste de courses** sont automatiquement ajoutés
3. Ces éléments sont regroupés dans une section spécifique, ajoutée à la fin :

```markdown
## Pas achetés la dernière fois
- [ ] Item non acheté
```

---

## 7. Contenu & édition (Markdown)

### Format

* Le **Markdown est le format interne unique**
* L’interface fournit :

  * un grand champ texte éditable
  * un rendu visuel lisible

### Checkboxes

* Syntaxe Markdown standard :

```markdown
- [ ] Lait
- [x] Pain
```

### Comportement

* Quand un item est coché :

  * il reste à la même position
  * il est affiché en **barré (strikethrough)**
* Aucun déplacement automatique des items

---

## 8. UX / UI

### Principes

* Interface volontairement simple
* Peu de boutons
* Priorité à l’édition rapide

### Ajout rapide

* Pas de formulaire par item
* Toute la liste est éditée comme une note Markdown libre

### Organisation

* Pas de catégories structurées
* Les sections sont créées manuellement via Markdown (titres `##`, etc.)

---

## 9. Synchronisation & données

### Stockage

* Base de données **locale / minimaliste**
* Hébergement personnel

### Synchronisation

* Pas de temps réel
* Synchronisation :

  * à l’ouverture de l’application
  * ou à l’enregistrement

### Gestion des conflits

* Approche simple (last write wins acceptable)

---

## 10. Stack technique (indicative)

* **Frontend / Backend** : SvelteKit
* Base de données : postgresql en local
* Application monolithique
* Progressive Web App (PWA) recommandée pour le hors ligne

---

## 11. Objectifs non fonctionnels

* Très faible complexité
* Code facile à maintenir
* Peu ou pas d’itérations prévues après la V1
* Stabilité > évolutivité

---

## 12. Critères de succès

* Les deux utilisateurs utilisent l’application au quotidien
* Plus de listes papier
* Plus d’oubli de liste en faisant les courses
* Temps nécessaire pour ajouter un item : quelques secondes

---

## 13. Hors scope explicite

* Notifications
* Collaboration en temps réel
* Historique détaillé des modifications
* Permissions avancées
* Multi-langue
