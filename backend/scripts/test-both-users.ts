import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testBothUsers() {
  try {
    console.log('=== PROBANDO LOGIN CON PERMISOS ===\n');

    // Test 1: Login con usuario Junior
    console.log('TEST 1: Login con usuario Junior (testjunior)...');
    const juniorRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'testjunior',
      password: 'test123'
    });

    console.log('✓ Login exitoso\n');
    console.log('Usuario:', juniorRes.data.user.username);
    console.log('Nivel:', juniorRes.data.user.nivel);

    if (juniorRes.data.user.permisos) {
      console.log('\nPermisos del usuario Junior:');
      console.table(juniorRes.data.user.permisos);
    } else {
      console.log('\n⚠️  No se encontraron permisos en la respuesta');
    }

    // Test 2: Login con usuario Admin
    console.log('\n\nTEST 2: Login con usuario Admin (RonnieHdez)...');
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'RonnieHdez',
      password: 'Soccer04'
    });

    console.log('✓ Login exitoso\n');
    console.log('Usuario:', adminRes.data.user.username);
    console.log('Nivel:', adminRes.data.user.nivel);

    if (adminRes.data.user.permisos) {
      console.log('\nPermisos del usuario Admin:');
      console.table(adminRes.data.user.permisos);
    } else {
      console.log('\n⚠️  No se encontraron permisos en la respuesta');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBothUsers();
