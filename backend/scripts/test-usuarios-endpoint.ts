import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testUsuariosEndpoint() {
  try {
    // 1. Login para obtener token
    console.log('1. Realizando login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'RonnieHdez',
      password: 'Soccer04'
    });

    const token = loginRes.data.token;
    console.log('✓ Login exitoso');
    console.log(`Token: ${token.substring(0, 20)}...`);

    // 2. Obtener lista de usuarios
    console.log('\n2. Obteniendo lista de usuarios...');
    const usuariosRes = await axios.get(`${API_URL}/usuarios`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Usuarios obtenidos exitosamente');
    console.log(`Total de usuarios: ${usuariosRes.data.data.length}`);
    console.log('\n=== USUARIOS ===');
    console.table(usuariosRes.data.data.map((u: any) => ({
      ID: u.ID,
      Nombre: u.Nombre,
      Usuario: u.Usuario,
      Nivel: u.Nivel,
      Estatus: u.Estatus,
      Federacion: u.Id_Federacion
    })));

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUsuariosEndpoint();
