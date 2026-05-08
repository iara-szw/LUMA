# 🐾 Plataforma para Refugios de Animales

Proyecto final de la materia de Informática – Secundaria ORT  
**Iara Szwarstein & Juana López Valenzuela**

---

## 📋 Descripción

Plataforma web orientada a refugios de animales que busca digitalizar y simplificar tres procesos clave:

- **Adopción**: publicación de animales disponibles, gestión de solicitudes y seguimiento del proceso en tiempo real.
- **Capacitación**: recursos y materiales para que los adoptantes lleguen preparados antes de recibir al animal.
- **Seguimiento post adopción**: canal de comunicación entre el refugio y el adoptante para acompañar la adaptación del animal en su nuevo hogar.

---

## 🚀 Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Estilos | HTML + CSS |
| Backend | Node.js |
| Base de datos | Supabase |

---

## ⚙️ Instalación y uso local

### Requisitos previos
- Node.js instalado
- Cuenta en Supabase con el proyecto configurado

### Pasos

1. Cloná el repositorio:
```bash
git clone https://github.com/usuario/nombre-del-repo.git
cd nombre-del-repo
```

2. Instalá las dependencias:
```bash
npm install
```

3. Creá un archivo `.env` en la raíz del proyecto con las variables de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

4. Corré el proyecto en modo desarrollo:
```bash
npm run dev
```

5. Abrí el navegador en `http://localhost:5173`

---

## 📁 Estructura del proyecto

```
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Vistas principales
│   ├── styles/           # Archivos CSS
│   └── main.jsx          # Punto de entrada
├── public/
├── .env                  # Variables de entorno (no incluido en el repo)
├── package.json
└── README.md
```

---

## 👩‍💻 Equipo

| Nombre | GitHub |
|---|---|
| Iara Szwarstein | [@iara](https://github.com/) |
| Juana López Valenzuela | [@juana](https://github.com/) |

---

## 📌 Estado del proyecto

🟡 En desarrollo – Proyecto académico 2025
