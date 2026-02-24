/**
 * Script de migración para mover fotos de carnets
 * De: uploads/carnets/{codigo}/foto-{codigo}.jpg
 * A: uploads/carnets/foto-{codigo}.jpg
 *
 * Este script consolidará todas las fotos de las subcarpetas individuales
 * a una sola carpeta, mejorando el rendimiento del sistema de archivos.
 */

import fs from 'fs';
import path from 'path';

const CARNET_PHOTOS_DIR = path.join(process.cwd(), 'uploads', 'carnets');

interface MigrationStats {
  totalCarpetas: number;
  fotosMovidas: number;
  carpetasEliminadas: number;
  errores: number;
  erroresDetalle: string[];
}

async function migrarFotosCarnets(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalCarpetas: 0,
    fotosMovidas: 0,
    carpetasEliminadas: 0,
    errores: 0,
    erroresDetalle: []
  };

  console.log('🚀 Iniciando migración de fotos de carnets...');
  console.log(`📁 Directorio base: ${CARNET_PHOTOS_DIR}\n`);

  // Verificar que el directorio existe
  if (!fs.existsSync(CARNET_PHOTOS_DIR)) {
    console.log('❌ El directorio de carnets no existe. No hay nada que migrar.');
    return stats;
  }

  // Leer todos los elementos en el directorio
  const items = fs.readdirSync(CARNET_PHOTOS_DIR, { withFileTypes: true });

  // Filtrar solo directorios (las subcarpetas de carnets)
  const carpetas = items.filter(item => item.isDirectory());
  stats.totalCarpetas = carpetas.length;

  console.log(`📊 Encontradas ${stats.totalCarpetas} carpetas de carnets\n`);

  if (stats.totalCarpetas === 0) {
    console.log('✅ No hay carpetas que migrar. El sistema ya está usando la nueva estructura.');
    return stats;
  }

  // Procesar cada carpeta
  for (const carpeta of carpetas) {
    const carpetaNombre = carpeta.name;
    const carpetaPath = path.join(CARNET_PHOTOS_DIR, carpetaNombre);

    try {
      // Buscar archivos en la carpeta
      const archivos = fs.readdirSync(carpetaPath);

      // Buscar la foto del carnet (generalmente foto-{codigo}.jpg)
      const fotoArchivo = archivos.find(archivo =>
        archivo.startsWith('foto-') && archivo.endsWith('.jpg')
      );

      if (fotoArchivo) {
        const origenPath = path.join(carpetaPath, fotoArchivo);
        const destinoPath = path.join(CARNET_PHOTOS_DIR, fotoArchivo);

        // Verificar si el destino ya existe
        if (fs.existsSync(destinoPath)) {
          console.log(`⚠️  Ya existe: ${fotoArchivo} - Se sobrescribirá`);
          fs.unlinkSync(destinoPath);
        }

        // Mover el archivo
        fs.renameSync(origenPath, destinoPath);
        stats.fotosMovidas++;
        console.log(`✅ Movido: ${fotoArchivo}`);
      }

      // Eliminar la carpeta ahora vacía (o con archivos temporales)
      fs.rmSync(carpetaPath, { recursive: true, force: true });
      stats.carpetasEliminadas++;

    } catch (error) {
      stats.errores++;
      const errorMsg = `Error procesando carpeta ${carpetaNombre}: ${error}`;
      stats.erroresDetalle.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  return stats;
}

// Ejecutar la migración
migrarFotosCarnets()
  .then((stats) => {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE LA MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`📁 Total de carpetas encontradas: ${stats.totalCarpetas}`);
    console.log(`📸 Fotos movidas exitosamente: ${stats.fotosMovidas}`);
    console.log(`🗑️  Carpetas eliminadas: ${stats.carpetasEliminadas}`);
    console.log(`❌ Errores: ${stats.errores}`);

    if (stats.erroresDetalle.length > 0) {
      console.log('\n⚠️  DETALLES DE ERRORES:');
      stats.erroresDetalle.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n' + '='.repeat(60));

    if (stats.errores === 0) {
      console.log('✅ Migración completada exitosamente!');
      console.log('💡 Las fotos ahora están todas en: uploads/carnets/');
      console.log('💡 El sistema seguirá funcionando con retrocompatibilidad.');
    } else {
      console.log('⚠️  Migración completada con algunos errores.');
      console.log('💡 Revisa los errores arriba para más detalles.');
    }

    process.exit(stats.errores > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal durante la migración:');
    console.error(error);
    process.exit(1);
  });
