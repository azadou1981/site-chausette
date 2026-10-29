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



## Next request (2026-10-29 10:54, 01-ajoute-les-fonctionnalités-suivantes-à-m)

# Ajoute les fonctionnalités suivantes à mon projet …

Demandé le 2026-10-29 11h54.

Ajoute les fonctionnalités suivantes à mon projet existant (frontend React + backend Next.js) :

1. Authentification Google (OAuth) :
   - Ajoute un bouton "Continuer avec Google" sur les pages de connexion et d'inscription.
   - Implémente la logique d'authentification Google côté backend et frontend.
   - Indique la configuration requise dans le fichier .env (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).

2. Intégration du Logo & Branding :
   - Intègre le logo dans la barre de navigation : le texte "unik." en lettres arrondies rouges (#ED2939) avec le slogan "comme vous" juste en dessous.
   - Respecte le fond global de la page (#F6E6D1).

3. Compte Administrateur de Test :
   - Crée un script d'initialisation (seeding) pour générer automatiquement un compte administrateur en base de données.
   - Identifiants : email "admin@unik.com", mot de passe "admin123", rôle "admin".

Fournis uniquement le code et les fichiers modifiés ou créés pour intégrer ces ajouts.

## Fichiers joints

- `.athanor/attachments/01-ajoute-les-fonctionnalités-suivantes-à-m/3f6610a6-8716-463c-9871-640847ccdf8b.jpg` (JPG, 12 KB)

