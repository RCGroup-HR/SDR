# 🎴 Cómo Acceder al Sistema de Gestión de Carnets

## ✅ Todo está listo!

El sistema de gestión de carnets ya está completamente integrado en tu aplicación.

---

## 🚀 Acceso Rápido

### **Opción 1: Desde la Aplicación Web (Recomendado)**

1. **Abre tu aplicación:**
   ```
   http://localhost:5173
   ```

2. **Inicia sesión** con tu usuario

3. **En el menú lateral:**
   - Click en **"Mantenimientos"** para expandir
   - Busca **"🎴 Gestión de Carnets"**
   - Click en el enlace

4. **¡Listo!** Ya estás en la página de gestión de carnets

---

### **Opción 2: Acceso Directo (URL)**

Si ya iniciaste sesión:
```
http://localhost:5173/gestion-carnets
```

---

## 🎯 ¿Qué puedes hacer?

### **1. Configurar Parámetros** (Primera vez)
- Click en "Configurar Parámetros"
- Completa la información de tu institución
- Selecciona colores personalizados
- Guarda

### **2. Subir Fotos de Jugadores**
- Busca el carnet del jugador
- Click en "📷 Foto"
- Selecciona imagen
- Sube (se optimiza automáticamente)

### **3. Vista Previa**
- Click en "👁️ Preview"
- Ve cómo se verá el carnet antes de generar

### **4. Generar PDF**
- Click en "📄 Generar"
- Se descarga automáticamente el PDF profesional

---

## 📋 Primera Configuración

### **Paso 1: Ejecutar Script SQL** (Solo la primera vez)

**Opción A - Archivo .bat:**
Haz doble clic en: `instalar-carnets.bat`

**Opción B - MySQL Workbench:**
1. Abre MySQL Workbench
2. Conecta a `sdr_domino`
3. Abre: `backend\sql\INSTALAR_SISTEMA_CARNETS.sql`
4. Ejecuta todo (Ctrl+Shift+Enter)

### **Paso 2: Configurar Parámetros**

La primera vez que entres a "Gestión de Carnets":
1. Click en "Configurar Parámetros"
2. Completa:
   - Nombre de tu institución
   - Colores (opcional, hay valores por defecto)
   - Texto al pie
   - Vigencia del carnet
3. Guarda

Ya está todo listo!

---

## 🎴 Ubicación del Botón

El botón se encuentra en el **menú lateral izquierdo**:

```
📋 Mantenimientos  ← Click aquí para expandir
   ├── 🎲 Partidas
   ├── 🏆 Torneos
   ├── ...
   ├── 🌎 Carnet Federacion
   ├── 🎴 Gestión de Carnets  ← ¡AQUÍ ESTÁ!
   ├── 🌍 Mant. Países
   └── ...
```

---

## 🔐 Permisos

El acceso está controlado por el módulo: **`carnet_federacion`**

Si un usuario tiene permisos para `Carnet Federacion`, también tendrá acceso a `Gestión de Carnets`.

---

## 🖼️ Características de la Interfaz

### **Tabla de Carnets**
- Lista completa de carnets
- Búsqueda por nombre, identificación, club
- Indicador visual si tiene foto ✅ o ❌

### **Botones de Acción**
- **📷 Foto** - Subir/actualizar foto del jugador
- **👁️ Preview** - Vista previa HTML del carnet
- **📄 Generar** - Descargar PDF del carnet

### **Configuración**
- **Configurar Parámetros** - Personalizar institución, colores, etc.

---

## 📂 Archivos Generados

Los archivos se guardan automáticamente en:

```
backend/uploads/
├── carnets/
│   └── {codigo-carnet}/
│       └── foto-{codigo-carnet}.jpg
├── logos/
│   └── logo-fed-{id}.png
└── carnets-pdf/
    └── carnet-{codigo-carnet}.pdf
```

---

## ⚡ Atajos de Teclado

Una vez en la página, puedes:
- **Buscar:** Click en el campo de búsqueda
- **Tab:** Navegar entre campos
- **Enter:** En búsqueda, ejecutar búsqueda

---

## 🐛 Solución de Problemas

### No veo el botón "Gestión de Carnets"
**Solución:**
1. Verifica que tengas permisos para `carnet_federacion`
2. Refresca la página (F5)
3. Cierra sesión y vuelve a iniciar

### Error al cargar la página
**Solución:**
1. Verifica que el servidor esté corriendo en puerto 3000
2. Ejecuta el script SQL si aún no lo has hecho
3. Revisa la consola del navegador (F12)

### Error: "Parámetros no configurados"
**Solución:**
Click en "Configurar Parámetros" y completa la información

---

## 📞 Ayuda Adicional

- **Documentación Técnica:** `DOCUMENTACION_SISTEMA_CARNETS.md`
- **Guía de Pruebas:** `GUIA_COMPLETA_PRUEBAS.md`
- **Instalación:** `INSTALACION_RAPIDA_CARNETS.md`

---

## 🎉 ¡A Disfrutar!

El sistema está completamente funcional y listo para usar.

**Ruta directa:** http://localhost:5173/gestion-carnets
