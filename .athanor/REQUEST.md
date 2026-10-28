# Agis en tant que développeur Full-Stack expert en …

Demandé le 2026-10-28 11h55.

Agis en tant que développeur Full-Stack expert en React et Next.js. Ton objectif est de développer une plateforme e-commerce dédiée à la vente de chaussettes. 

L'architecture du projet doit être strictement séparée en deux dossiers distincts :
1. "frontend" : Une application React (générée via Vite ou Create React App) pour l'interface utilisateur.
2. "backend" : Une API construite avec Next.js (via les API Routes) ou Node.js/Express, dédiée uniquement à la logique serveur et la base de données.

Voici le cahier des charges détaillé à respecter :

**1. Design et UI/UX (Frontend)**
- Couleur de fond principale de l'application : #F6E6D1
- Couleur principale des boutons et actions (Call to Action) : #ED2939
- Le design doit être responsive, moderne et épuré.

**2. Espace Utilisateur (Client)**
- Système d'inscription et de connexion complet.
- Catalogue de chaussettes avec affichage des images, titres, descriptions et prix.
- Panier d'achat fonctionnel.

**3. Panel Administrateur (Backend & Frontend)**
- Route protégée accessible uniquement aux utilisateurs ayant le rôle "admin".
- Dashboard CRUD complet pour les articles (chaussettes) : Créer, Lire, Mettre à jour, Supprimer.
- Gestion de l'upload d'images pour les articles (ex: via Multer, Cloudinary ou AWS S3).

**4. Sécurité et Bonnes Pratiques**
- Authentification sécurisée (ex: JWT stocké en HTTP-only cookies).
- Hachage des mots de passe (bcrypt ou Argon2) avant stockage en base de données.
- Protection contre les failles courantes : configuration stricte des CORS (n'autoriser que le port du frontend), protection XSS, protection CSRF, et limitation de requêtes (Rate Limiting).
- Validation rigoureuse des données entrantes (ex: avec Zod ou Joi).

Pour commencer, fournis-moi la structure complète des deux dossiers (frontend et backend), puis détaille le code pour l'initialisation du serveur backend sécurisé et la configuration des variables d'environnement.

## Remarques en cours de route
(Vous pouvez écrire ici pendant que Claude travaille : il relit ce fichier au début de chaque cycle.)

