import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testPermisosNivel() {
  try {
    console.log('=== PROBANDO SISTEMA DE PERMISOS POR NIVEL ===\n');

    // Test 1: Usuario con permisos del nivel (Shdez - Senior)
    console.log('TEST 1: Usuario Senior SIN permisos personalizados (Shdez)');
    console.log('Debería heredar permisos del nivel Senior\n');

    try {
      const shdezRes = await axios.post(`${API_URL}/auth/login`, {
        username: 'Shdez',
        password: 'Soccer04'
      });

      console.log('✓ Login exitoso');
      console.log(`Usuario: ${shdezRes.data.user.username}`);
      console.log(`Nivel: ${shdezRes.data.user.nivel}`);
      console.log('\nPermisos heredados del nivel Senior:');
      console.table(shdezRes.data.user.permisos);
    } catch (error: any) {
      console.error('❌ Error en login Shdez:', error.response?.data || error.message);
    }

    // Test 2: Usuario con permisos personalizados (testjunior)
    console.log('\n\nTEST 2: Usuario Junior CON permisos personalizados (testjunior)');
    console.log('Debería usar permisos personalizados (no del nivel)\n');

    const juniorRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'testjunior',
      password: 'test123'
    });

    console.log('✓ Login exitoso');
    console.log(`Usuario: ${juniorRes.data.user.username}`);
    console.log(`Nivel: ${juniorRes.data.user.nivel}`);
    console.log('\nPermisos personalizados:');
    console.table(juniorRes.data.user.permisos);

    // Test 3: Usuario Admin (RonnieHdez)
    console.log('\n\nTEST 3: Usuario Admin CON permisos personalizados (RonnieHdez)');
    console.log('Debería usar permisos personalizados\n');

    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'RonnieHdez',
      password: 'Soccer04'
    });

    console.log('✓ Login exitoso');
    console.log(`Usuario: ${adminRes.data.user.username}`);
    console.log(`Nivel: ${adminRes.data.user.nivel}`);
    console.log('\nPermisos personalizados:');
    console.table(adminRes.data.user.permisos);

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPermisosNivel();
