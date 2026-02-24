#!/usr/bin/env node

/**
 * Generador de JWT Secret Seguro
 *
 * Este script genera un secreto aleatorio de 64 bytes (128 caracteres hexadecimales)
 * para usar como JWT_SECRET en el archivo .env de producción
 */

const crypto = require('crypto');

console.log('\n🔐 Generador de JWT Secret\n');
console.log('═'.repeat(60));

// Generar secreto de 64 bytes
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ JWT Secret generado exitosamente:\n');
console.log('JWT_SECRET=' + secret);
console.log('\n');
console.log('📋 Copia esta línea completa y pégala en tu archivo .env');
console.log('⚠️  IMPORTANTE: No compartas este secreto con nadie');
console.log('⚠️  Guárdalo de forma segura');
console.log('\n' + '═'.repeat(60) + '\n');

// Información adicional
console.log('💡 Información:');
console.log('   - Longitud: 128 caracteres');
console.log('   - Formato: Hexadecimal');
console.log('   - Entropía: 512 bits');
console.log('   - Uso: Variable JWT_SECRET en .env');
console.log('\n');
