import axios from 'axios';

async function testFederaciones() {
  try {
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    // Test federaciones endpoint
    const fedResponse = await axios.get('http://localhost:3000/api/federaciones', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n✓ Federaciones endpoint working!');
    console.log(`\nTotal federaciones: ${fedResponse.data.length}`);

    if (fedResponse.data.length > 0) {
      console.log('\nFirst 3 federaciones:');
      fedResponse.data.slice(0, 3).forEach((fed: any) => {
        console.log(`\nFed ${fed.Id_Federacion}:`);
        console.log(`  Nombre: ${fed.Nombre_Federacion || 'N/A'}`);
        console.log(`  Bandera: ${fed.Bandera_Ruta || 'N/A'}`);
        console.log(`  Carnets: ${fed.total_carnets}`);
        console.log(`  Tiene params: ${fed.tiene_parametros ? 'Sí' : 'No'}`);
        if (fed.tiene_parametros) {
          console.log(`  Institución: ${fed.Nombre_Institucion}`);
          console.log(`  Colores: ${fed.Color_Primario}, ${fed.Color_Secundario}`);
        }
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('\nServer error details:', error.response.data);
    }
    process.exit(1);
  }
}

testFederaciones();
