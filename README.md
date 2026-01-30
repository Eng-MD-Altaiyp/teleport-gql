<div align="center">
  
#  Teleport GQL

### A Modern GraphQL IDE & Explorer

**Build, Test, and Debug GraphQL Queries with Ease**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## Screenshots

<details>
<summary> Dark Mode</summary>

<!-- Add your dark mode screenshot here -->
![Dark Mode](./public/ui/dark-mode.png)

</details>

<details>
<summary>Light Mode</summary>

<!-- Add your light mode screenshot here -->
![Light Mode](./public/ui/light-mode.png)

</details>

<details>
<summary> Mobile View</summary>

<!-- Add your mobile screenshot here -->
![Mobile View](./public/ui/mobile-view.png)

</details>

---

##  Features

| Feature | Description |
|---------|-------------|
|  **Schema Introspection** | Auto-fetch and explore GraphQL schemas from any endpoint |
|  **Visual Schema Explorer** | Interactive tree view to browse types, queries, and mutations |
|  **Point-and-Click Query Builder** | Select fields visually and auto-generate queries |
|  **Query Execution** | Execute queries and see results instantly |
|  **Response Metrics** | View response time, status codes, and payload size |
|  **Dark/Light Mode** | Beautiful themes with smooth transitions |
|  **Fully Responsive** | Works seamlessly on desktop, tablet, and mobile |
|  **Modern UI** | Glassmorphism design with premium aesthetics |

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Eng-MD-Altaiyp/teleport-gql.git
cd teleport-gql

# Install dependencies
pnpm i

# Start the development server
pnpm dev or pnpm dev --host 0.0.0.0 --port 5173
```


The app will be available at `http://localhost:5173` or `http://0.0.0.0:5173`.


---

##  Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript 5.9** | Type Safety |
| **Vite 7** | Build Tool & Dev Server |
| **Tailwind CSS 4** | Styling |
| **GraphQL.js** | Schema Handling & Query Building |
| **Lucide React** | Icons |

---

##  Project Structure

```
teleport-gql/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI elements (Button, etc.)
│   │   └── layout/       # Layout components (Header, etc.)
│   ├── features/         # Feature modules
│   │   ├── request/      # Request panel & endpoint bar
│   │   └── introspection/# Schema tree & explorer
│   ├── services/         # API & GraphQL services
│   ├── utils/            # Utility functions
│   ├── context/          # React context (Theme, etc.)
│   ├── layouts/          # Page layouts
│   └── App.tsx           # Main application entry
├── public/               # Static assets
└── index.html            # HTML entry point
```

---

##  How to Use

1. **Enter Endpoint** – Paste your GraphQL API URL in the endpoint bar
2. **Connect** – Click the  Connect button to fetch the schema
3. **Explore Schema** – Browse available queries and fields in the tree view
4. **Select Fields** – Check the fields you want to include in your query
5. **Execute** – Click Execute to run the generated query
6. **View Response** – See the JSON response with timing and status info

---

##  Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

##  Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##  License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  
**Made with by Altaiyp**

</div>
