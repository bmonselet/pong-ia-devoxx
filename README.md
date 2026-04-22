# 🎮 Pong IA - Jeu Pong avec IA Jouable via GitHub Pages

Un jeu Pong classique jouable en ligne, enrichi d'une IA intelligente avec 3 niveaux de difficulté. Construite avec **Phaser 4**, **React 19** et **TypeScript**, cette application démontre l'intégration fluide entre un moteur de jeu 2D et une interface utilisateur moderne.

## 🎯 Jouer En Ligne

**[🚀 Lancer le jeu directement ici](https://bmonselet.github.io/pong-ia-devoxx/)**

Aucune installation requise - ouvrez simplement le lien ci-dessus et commencez à jouer !

## ✨ Caractéristiques Principales

- **Gameplay Pong Classique** - L'expérience Pong traditionnelle revisitée
- **IA Adaptative** - 3 niveaux de difficulté pour tous les niveaux de joueurs
- **Interface React Moderne** - UI élégante et réactive pour contrôler le jeu
- **Déploiement GitHub Pages** - Jouer en ligne sans serveur backend
- **TypeScript** - Code fortement typé pour une meilleure maintenabilité
- **Performance Optimisée** - Construit avec Vite pour des temps de chargement rapides

## 🎮 Comment Jouer

### Contrôles
- **Flèche Haut** (`↑`) - Déplacer la raquette vers le haut
- **Flèche Bas** (`↓`) - Déplacer la raquette vers le bas

### Gameplay
1. **Sélectionnez la difficulté** - Choisissez parmi Facile, Moyen ou Difficile
2. **Cliquez sur "New Game"** - Lancez une partie
3. **Marquez des points** - Envoyez la balle de l'autre côté de la raquette de l'IA pour scorer
4. **Défendez-vous** - Bloquez la balle pour ne pas perdre de points
5. **Gagnez la partie** - Soyez le premier à atteindre 10 points !

### Objectif
Marquer plus de points que l'IA en renvoyant la balle au-delà de sa raquette.

## 🛠️ Installation Locale

### Prérequis
- Node.js 16+ et npm

### Étapes d'Installation

```bash
# Cloner le dépôt
git clone https://github.com/bmonselet/pong-ia-devoxx.git

# Accéder au répertoire du projet
cd pong-ia-devoxx

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Puis ouvrez votre navigateur et accédez à **http://localhost:8080**

## 📁 Structure du Projet

```
pong-ia-devoxx/
├── src/
│   ├── game/              # Logique du jeu Phaser
│   │   ├── PongGame.ts    # Classe principale du jeu
│   │   └── PongAI.ts      # Système IA avec 3 niveaux
│   ├── App.tsx            # Composant React principal
│   ├── App.css            # Styles de l'interface
│   └── main.tsx           # Point d'entrée React
├── public/                # Ressources statiques
├── dist/                  # Build de production (généré)
├── index.html             # Page HTML principale
├── package.json           # Dépendances et scripts
├── tsconfig.json          # Configuration TypeScript
└── vite/                  # Configuration Vite
```

### Architecture

- **Phaser 4** : Moteur 2D pour la physique, le rendu et la gestion des sprites
- **React 19** : Gestion de l'UI, sélection de difficulté et contrôles
- **TypeScript 5.7** : Typage statique pour plus de sécurité et de clarté
- **Vite 6.3** : Bundler ultra-rapide pour le développement et la production

## 🤖 Niveaux de Difficulté

### 🟢 Facile
- L'IA a une **vitesse de réaction lente** (200ms délai)
- Mouvements **erratiques et imprévisibles**
- **Imprécision délibérée** pour laisser des opportunités de score
- Parfait pour les débutants ou pour s'échauffer

### 🟡 Moyen
- Vitesse de réaction **modérée** (80ms délai)
- Stratégie **équilibrée** : tente de bloquer mais peut être battue
- **Compétence variable** selon la situation
- Idéal pour un défi moderé et un jeu amusant

### 🔴 Difficile
- Vitesse de réaction **ultra-rapide** (20ms délai)
- IA **quasi-parfaite** dans sa prédiction et son positionnement
- Mouvements **optimisés** pour maximiser les chances de blocage
- Pour les joueurs aguerris cherchant un vrai défi !

## 🚀 Déploiement

Le projet est configuré pour se déployer automatiquement sur GitHub Pages.

### Déploiement Manuel
```bash
npm run deploy
```

Cela va :
1. Construire l'application (`npm run build`)
2. Déployer le dossier `dist/` sur la branche `gh-pages`
3. Publier automatiquement à : `https://bmonselet.github.io/pong-ia-devoxx/`

### Déploiement Automatique (GitHub Actions)
Un workflow GitHub Actions construit et déploie automatiquement chaque push sur la branche `main`. Voir `.github/workflows/` pour plus de détails.

## 📦 Technologies Utilisées

- **[Phaser 4](https://phaser.io/)** - Framework de jeu 2D HTML5
- **[React 19](https://react.dev/)** - Bibliothèque UI JavaScript
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Superset typé de JavaScript
- **[Vite 6.3](https://vitejs.dev/)** - Bundler frontend ultra-rapide
- **[GitHub Pages](https://pages.github.com/)** - Hébergement statique gratuit

## 🧪 Scripts Disponibles

```bash
# Développement avec logs
npm run dev

# Développement sans logs
npm run dev-nolog

# Build production
npm run build

# Build production sans logs
npm run build-nolog

# Déployer sur GitHub Pages
npm run deploy
```

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour les détails complets.

## 👨‍💻 Auteur

Créé pour la conférence [Devoxx France](https://www.devoxx.fr/) - 2024

## 🔗 Ressources Utiles

- [Documentation Phaser 4](https://phaser.io/docs)
- [Documentation React](https://react.dev)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Guide Vite](https://vitejs.dev/guide/)
- [GitHub Pages Deployment](https://docs.github.com/en/pages/getting-started-with-github-pages)

## 💡 Améliorations Futures

- [ ] Système de scores persistants (localStorage)
- [ ] Son et effets visuels
- [ ] Mode multijoueur local (2 joueurs)
- [ ] Statistiques de gameplay
- [ ] Thèmes visuels personnalisables
- [ ] Animations de résultats et feed-back
- [ ] Touch controls pour mobile

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## ❓ Support

Si vous rencontrez des problèmes :
1. Assurez-vous que Node.js 16+ est installé
2. Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`
3. Videz le cache de votre navigateur
4. Consultez la console du navigateur pour les erreurs

---

**Bon jeu! 🏓** Pouvez-vous battre l'IA ?
