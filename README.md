# OriginGFX

**Gallery First. Store Second. Artist Always.**

OriginGFX is a modern digital gallery built for Minecraft artists to showcase their work, build professional portfolios, and connect with a global community. Instead of placing commissions and sales first, OriginGFX focuses on helping artists gain visibility through high-quality galleries and curated artist profiles.

The project was created by **Alpredo FX** as a personal initiative to provide Minecraft artists with a dedicated platform where their work can be discovered beyond social media feeds.

---

## ✨ Why OriginGFX?

Unlike traditional portfolio websites or marketplaces, OriginGFX is designed around one simple philosophy:

> **Gallery First. Store Second. Artist Always.**

Every artwork leads visitors to its creator, encouraging discovery before promotion. The platform is built to celebrate artists, not just transactions.

---

## 🚀 Features

### Gallery

* Featured artworks
* Latest uploads
* Trending artworks
* Artwork detail pages
* Related artworks
* Responsive gallery layout

### Artists

* Professional artist profiles
* Biography & portfolio
* Commission status
* Services & specialties
* Social media links
* Featured artists

### Discovery

* Real-time search
* Category filtering
* Artist filtering
* SEO-friendly pages

### Platform

* Dark & Light mode
* Responsive design
* Fast loading experience
* Supabase integration
* Automatic data fallback using local JSON

---

## 🛠 Tech Stack

| Category              | Technology          |
| --------------------- | ------------------- |
| Static Site Generator | Eleventy (11ty)     |
| Database              | Supabase PostgreSQL |
| Storage               | Supabase Storage    |
| Styling               | HTML5 + CSS3        |
| JavaScript            | Vanilla JavaScript  |
| Deployment            | Netlify             |
| Version Control       | Git & GitHub        |

---

## 📂 Project Structure

```text
origingfx/
│
├── src/
│   ├── _data/
│   ├── _includes/
│   ├── assets/
│   ├── artists/
│   ├── artworks/
│   └── pages/
│
├── upload-all.js
├── package.json
├── .eleventy.js
└── README.md
```

---

## ⚙ Getting Started

Clone the repository:

```bash
git clone https://github.com/AlpredoFX/origingfx.git
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```env
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

Run the development server:

```bash
npm start
```

Build for production:

```bash
npm run build
```

---

## 🗄 Database

OriginGFX uses **Supabase PostgreSQL** as its primary database and **Supabase Storage** for media assets.

Current collections include:

* Artists
* Artworks
* Categories
* Badges
* Social Links

When Supabase is unavailable during development, OriginGFX automatically falls back to local JSON data, allowing the website to continue working without interruption.

---

## 🎨 Design Philosophy

OriginGFX is built around three core principles:

* **Gallery First** – Artwork always comes first.
* **Store Second** – Commissions are available, but never dominate the experience.
* **Artist Always** – Every artwork should help visitors discover the artist behind it.

The goal is to create a platform where artists build long-term portfolios instead of simply listing services.

---

## 🗺 Roadmap

### Completed

* Responsive layout
* Artist profiles
* Artwork pages
* Gallery system
* Supabase integration
* Local JSON fallback
* Featured artworks
* Featured artists

### In Progress

* Search system
* Advanced filtering
* SEO improvements
* Performance optimization
* Dynamic content

### Planned

* Artist dashboard
* Authentication
* Direct artwork uploads
* Bookmark system
* Comments
* Notifications
* Analytics
* Community features

---

## 🤝 Contributing

Contributions are welcome.

If you'd like to improve OriginGFX:

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Creator

**Alpredo FX**

Founder of OriginGFX

* 🌐 Website: [https://origingfx.com](https://origingfx.com)
* 🐙 GitHub: [https://github.com/AlpredoFX](https://github.com/AlpredoFX)
* 🐦 X (Twitter): [https://twitter.com/AlpredoFX](https://twitter.com/AlpredoFX)

---

## ❤️ Special Thanks

Special thanks to the Minecraft art community and every artist who shares their creativity through OriginGFX.

Together, we're building a place where every artwork deserves to be discovered.

---

> **Gallery First. Store Second. Artist Always.**