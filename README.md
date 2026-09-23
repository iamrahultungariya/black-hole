# 🌌 Event Horizon — 3D Black Hole Observatory

An interactive, scientifically-grounded 3D cosmic observatory visualizing and comparing 35 real celestial black holes across cosmic mass scales ($10^0 - 10^{10} M_\odot$).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiamrahultungariya%2Fblack-hole)

---

## ✨ Features

- **Relativistic Gravitational Lensing**: Realistic *Interstellar* Gargantua-style photon spheres, curved upper/lower Einstein lensing rings, and accretion disk dust particle flows.
- **Spacetime Curvature Grid**: Dynamic deep-space cyan-indigo wireframe ("jaali") illustrating gravitational well depression proportional to $\log_{10}(M/M_\odot)$.
- **3D Diagonal Trajectory**: Arranged on a continuous 3D path with relaxation algorithms ensuring no cramped clusters or overlapping models.
- **Dynamic Scale Exploration**:
  - **Logarithmic**: Balances visual clarity across 10 orders of magnitude.
  - **True Scale**: Physically accurate relative radii ($R_s = \frac{2GM}{c^2}$).
  - **Equal Spacing**: Side-by-side comparative inspection.
- **Cinematic Camera & Mass Tour**: Interactive cinematic camera focus on any black hole with smooth orbit controls and an automated guided tour.
- **Collapsible Glassmorphic Sidebar**: Filter by classification (*Stellar*, *Intermediate*, *Supermassive*, *Ultramassive*), real-time search, and instant focal navigation.
- **Fully Mobile & Touch Optimized**: Responsive HUD, bottom scrubber axis, and touch gesture controls.

---

## 🚀 Deploy to Vercel

### Method 1: 1-Click Deploy
Click the button below to automatically clone and deploy to your Vercel account:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiamrahultungariya%2Fblack-hole)

### Method 2: Manual Import via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your GitHub account and import **`iamrahultungariya/black-hole`**.
3. Configure the Project Settings:
   - **Framework Preset**: `Other` (or `Vite`)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty / default (Nitro uses Vercel Build Output API v3 into `.vercel/output`)
   - **Install Command**: `npm install`
4. Click **Deploy**.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+ or 22+
- npm

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/iamrahultungariya/black-hole.git
cd black-hole

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser: http://localhost:8080
```

### Production Build & Typecheck
```bash
# Verify TypeScript types
npm run typecheck

# Build for production
npm run build
```

---

## 🪐 Black Holes Featured (Sample)
- **Stellar Remnants**: Gaia BH1, Cygnus X-1, V404 Cygni, GRO J1655-40
- **Intermediate-Mass (IMBH)**: HLX-1, NGC 2276-3c, Omega Centauri IMBH
- **Supermassive (SMBH)**: Sagittarius A* (Milky Way), M87* (EHT Shadow), Andromeda SMBH
- **Cosmic Giants**: TON 618 ($6.6 \times 10^{10} M_\odot$), Phoenix A ($1.0 \times 10^{11} M_\odot$)

---

## 📄 License
MIT License. Built with React 19, Three.js / React Three Fiber, TanStack Start, and Tailwind CSS.
