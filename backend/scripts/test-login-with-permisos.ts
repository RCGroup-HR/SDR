import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testLoginWithPermisos() {
  try {
    console.log('=== PROBANDO LOGIN CON PERMISOS ===\n');

    // Login con usuario admin
    console.log('1. Login con usuario admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'RonnieHdez',
      password: 'Soccer04'
    });

    console.log('✓ Login exitoso\n');
    console.log('Usuario:', loginRes.data.user.username);
    console.log('Nivel:', loginRes.data.user.nivel);
    console.log('ID Federación:', loginRes.data.user.Id_Federacion);

    if (loginRes.data.user.permisos) {
      console.log('\nPermisos del usuario:');
      console.table(loginRes.data.user.permisos);
    } else {
      console.log('\n⚠️  No se encontraron permisos en la respuesta');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLoginWithPermisos();
