# 🐾 LUMA – Plataforma de Adopción Responsable de Animales

Proyecto final de Informática – Secundaria ORT  
**Iara S. & Juana L.**

---

## ✨ ¿Qué es LUMA?

LUMA es una aplicación móvil que centraliza y moderniza el proceso de adopción de mascotas en Argentina. Conecta adoptantes y refugios en una única plataforma, reemplazando los flujos fragmentados que hoy corren por Instagram, formularios sueltos, planillas de Excel, mails y grupos de WhatsApp.

El proyecto nació de una investigación de campo real: entrevistas con organizaciones de rescate y adoptantes que revelaron la misma frustración de ambos lados — procesos opacos, información dispersa y pérdida constante de postulaciones. LUMA no reemplaza cómo trabajan las organizaciones; digitaliza, ordena y hace más eficiente lo que ya hacen.

---

## 🎯 ¿Para quién es LUMA?

### Para refugios
- Publicación de animales con perfiles completos y actualizados
- Gestión centralizada de postulaciones y documentación
- Formularios personalizables según tipo de animal
- Seguimiento del estado de cada caso de adopción
- Comunicación post-adopción con los nuevos hogares
- Difusión de eventos

### Para adoptantes
- Descubrimiento de mascotas con información detallada y real
- Postulaciones simples y visibilidad del estado en tiempo real
- Contenido educativo para prepararse para una adopción responsable
- Acompañamiento durante todo el proceso, no solo al principio

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

## 🌱 Contexto y motivación

Argentina tiene miles de animales en situación de calle y una comunidad de rescatistas y refugios que trabaja con recursos limitados. Las plataformas existentes —como Petfinder o AdoptAR— funcionan principalmente como catálogos estáticos. LUMA apunta a algo diferente: acompañar todo el ciclo de adopción, desde el primer contacto hasta la adaptación del animal en su nuevo hogar.

La visión es que LUMA se convierta en la plataforma de referencia para la adopción responsable en Argentina — para que más mascotas encuentren el hogar adecuado, y las organizaciones puedan dedicar más energía al bienestar animal y menos a la administración.

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
