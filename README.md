# 🐾 LUMA – Plataforma para Refugios de Animales

Proyecto final de Informática – Secundaria ORT  
**Iara S. & Juana L.**

---

## ✨ ¿Qué es LUMA?

LUMA es una plataforma web diseñada para transformar la manera en que los refugios de animales gestionan sus procesos. Sabemos que los refugios hacen un trabajo enorme con recursos limitados, y LUMA nació para aliviar esa carga: menos WhatsApps perdidos, menos planillas desorganizadas y más tiempo para lo que realmente importa.

Con LUMA, los refugios pueden digitalizar tres procesos clave:

- 🐶 **Adopción** – Publicación de animales disponibles, gestión de solicitudes y seguimiento del proceso en tiempo real, todo desde un solo lugar.
- 📚 **Capacitación** – Recursos y materiales para que los adoptantes lleguen preparados y la transición sea lo mejor posible para el animal y para ellos.
- 💚 **Seguimiento post adopción** – Canal de comunicación continuo entre el refugio y el adoptante para acompañar la adaptación del animal en su nuevo hogar.

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
git clone https://github.com/iara-szw/LUMA
cd luma
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

5. Abrí el navegador en `http://localhost:5173` 🎉

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
| Iara Szwarstein | [@iara](https://github.com/iara-szw) |
| Juana López Valenzuela | [@juana](https://github.com/juaaloop) |

---

## 📌 Estado del proyecto

🟡 En desarrollo – Proyecto académico 2025

---

*Hecho con 💚 y muchas ganas de hacer algo que valga la pena.*
