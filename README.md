# 🐾 LUMA – Plataforma Centralizada de Adopción de Mascotas

Proyecto final de Informática – Secundaria ORT  
**Iara S. & Juana L.**

---

## ✨ ¿Qué es LUMA?

LUMA es una aplicación web/móvil que centraliza y moderniza el proceso de adopción de mascotas en Argentina. Conecta adoptantes y refugios en una única plataforma, reemplazando los flujos fragmentados que hoy corren por Instagram, formularios sueltos, planillas de Excel, mails y grupos de WhatsApp.

El proyecto nació de una investigación de campo real: entrevistas con organizaciones de rescate y adoptantes que revelaron la misma frustración de ambos lados — procesos opacos, información dispersa y pérdida constante de postulaciones. LUMA no reemplaza cómo trabajan las organizaciones; digitaliza, ordena y hace más eficiente lo que ya hacen.

---

## 🎯 ¿Para quién es LUMA?

### Para refugios
- Publicación de animales con perfiles completos y actualizados.
- Gestión centralizada de postulaciones y documentación.
- Formularios personalizables según tipo de animal.
- Seguimiento del estado de cada caso de adopción.
- Comunicación post-adopción con los nuevos hogares.
- Difusión de eventos.

### Para adoptantes
- Descubrimiento de mascotas con información detallada y real.
- Postulaciones simples y visibilidad del estado en tiempo real.
- Contenido educativo para prepararse para la llegada del animal.
- Acompañamiento durante todo el proceso, no solo al principio.

---

## 🔑 Funcionalidades principales

- 🐶 **Adopción** – Perfiles de animales, gestión de solicitudes y seguimiento en tiempo real desde un solo lugar.
- 📚 **Capacitación** – Recursos educativos para que los adoptantes lleguen preparados y la transición sea la mejor posible para el animal.
- 💚 **Seguimiento post-adopción** – Canal de comunicación continuo entre el refugio y el adoptante para acompañar la adaptación.
- 📋 **Formularios adaptables** – Cada organización puede personalizar sus formularios según sus criterios y el tipo de animal.
- 📅 **Difusión de eventos** – Espacio para que las organizaciones compartan jornadas de adopción y actividades.

---

## 🚀 Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Estilos | HTML + CSS modulares |
| Backend | Node.js |
| Base de datos & Auth | Supabase |

---

## ⚙️ Instalación y uso local

### Requisitos previos
- **Node.js** (versión 18.0 o superior recomendada)
- **npm** o **yarn**
- **Git**
- Cuenta y proyecto configurado en **Supabase** (con las tablas y buckets de Storage para fotos de perfil, portadas y mascotas creados).

### Pasos

1. Cloná el repositorio:
```bash
git clone [https://github.com/iara-szw/LUMA](https://github.com/iara-szw/LUMA)
cd luma

```

2. Instalá las dependencias:

```bash
npm install

```

3. Creá un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key

```

4. Corré el proyecto en modo desarrollo:

```bash
npm run dev

```

5. Abrí el navegador en `http://localhost:5173` 🎉

> **📱 Recomendación de visualización:** LUMA está diseñada bajo un enfoque **Mobile-First**. Si la probás desde una computadora, te recomendamos abrir las herramientas de desarrollador del navegador (`F12` o `Ctrl + Shift + I`) y activar la vista de dispositivo móvil (ej. 430px de ancho) para una experiencia óptima.

---

## 🛠️ Scripts disponibles

* `npm run dev` — Inicia el servidor de desarrollo local con recarga rápida.
* `npm run build` — Compila la aplicación para producción en la carpeta `dist/`.
* `npm run preview` — Previsualiza localmente la versión compilada de producción.
* `npm run lint` — Ejecuta el linter para verificar el formato y posibles errores en el código.

---

## 📁 Estructura del proyecto

```text
├── src/
│   ├── components/       # Componentes reutilizables (Loader, ConfirmModal, etc.)
│   ├── hooks/            # Custom hooks (ej. UsarAuth para manejo de sesión y roles)
│   ├── pages/            # Vistas principales separadas por rol (Refugio / Adoptante)
│   ├── repositories/     # Capa de acceso a datos y consultas a Supabase
│   ├── styles/           # Hojas de estilo CSS modulares por vista
│   └── main.jsx          # Punto de entrada
├── public/
├── .env                  # Variables de entorno (no incluido en el repo)
├── package.json
└── README.md

```

---

## 🌱 Contexto y motivación

Argentina tiene miles de animales en situación de calle y una comunidad de rescatistas y refugios que trabaja con recursos limitados. Las plataformas existentes —como Petfinder o AdoptAR— funcionan principalmente como catálogos estáticos. LUMA apunta a algo diferente: acompañar todo el ciclo de adopción, desde el primer contacto hasta la adaptación del animal en su nuevo hogar.

La visión es que LUMA se convierta en la plataforma centralizada de adopción de mascotas en Argentina — para que más mascotas encuentren el hogar adecuado, y las organizaciones puedan dedicar más energía al bienestar animal y menos a la administración.

---

## 👩‍💻 Equipo

| Nombre | GitHub |
| --- | --- |
| Iara Szwarstein | [@iara-szw](https://github.com/iara-szw) |
| Juana López Valenzuela | [@juaaloop](https://github.com/juaaloop) |

---

## 📌 Estado del proyecto

🟡 En desarrollo – Proyecto académico 2026

---

*Hecho con el objetivo de que cada mascota tenga un hogar.*

