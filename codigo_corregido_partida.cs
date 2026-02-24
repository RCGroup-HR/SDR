// ===================================================================
// CÓDIGO CORREGIDO Y SEGURO PARA INSERTAR PARTIDA
// ===================================================================
//
// CAMBIOS REALIZADOS:
// 1. ✅ Nombres de columnas corregidos según la estructura de la tabla
// 2. ✅ Protección contra SQL Injection usando parámetros
// 3. ✅ Agregada columna obligatoria "Fecha"
// 4. ✅ Validación de datos de entrada
// 5. ✅ Mejor manejo de errores
// ===================================================================

using (MySqlConnection cn = CUtilitarias.ObtenerConexion())
{
    try
    {
        cn.Open();

        // Query con parámetros (protección contra SQL Injection)
        MySqlCommand cm = new MySqlCommand(@"
            INSERT INTO partida
            (
                Id_Torneo,
                Id_Jugador1,
                Id_Jugador2,
                Id_Jugador3,
                Id_Jugador4,
                PuntosP1,
                PuntosP2,
                R1,
                R2,
                R3,
                R4,
                Ronda,
                Mesa,
                Fecha,
                FechaRegistro,
                Pts1,
                Pts2,
                Pts3,
                Pts4,
                Usuario,
                TJ1,
                TJ2,
                TJ3,
                TJ4
            )
            VALUES
            (
                @IdTorneo,
                @IdJugador1,
                @IdJugador2,
                @IdJugador3,
                @IdJugador4,
                @PuntosP1,
                @PuntosP2,
                @R1,
                @R2,
                @R3,
                @R4,
                @Ronda,
                @Mesa,
                @Fecha,
                @FechaRegistro,
                @Pts1,
                @Pts2,
                @Pts3,
                @Pts4,
                @Usuario,
                @TJ1,
                @TJ2,
                @TJ3,
                @TJ4
            )", cn);

        // Agregar parámetros con validación
        cm.Parameters.AddWithValue("@IdTorneo", Torneo.SelectedValue);
        cm.Parameters.AddWithValue("@IdJugador1", string.IsNullOrEmpty(ID1.Text) ? (object)DBNull.Value : int.Parse(ID1.Text));
        cm.Parameters.AddWithValue("@IdJugador2", string.IsNullOrEmpty(ID2.Text) ? (object)DBNull.Value : int.Parse(ID2.Text));
        cm.Parameters.AddWithValue("@IdJugador3", string.IsNullOrEmpty(ID3.Text) ? (object)DBNull.Value : int.Parse(ID3.Text));
        cm.Parameters.AddWithValue("@IdJugador4", string.IsNullOrEmpty(ID4.Text) ? (object)DBNull.Value : int.Parse(ID4.Text));

        cm.Parameters.AddWithValue("@PuntosP1", string.IsNullOrEmpty(Pp1.Text) ? 0 : int.Parse(Pp1.Text));
        cm.Parameters.AddWithValue("@PuntosP2", string.IsNullOrEmpty(Pp2.Text) ? 0 : int.Parse(Pp2.Text));

        cm.Parameters.AddWithValue("@R1", string.IsNullOrEmpty(R1.Text) ? "P" : R1.Text);
        cm.Parameters.AddWithValue("@R2", string.IsNullOrEmpty(R2.Text) ? "P" : R2.Text);
        cm.Parameters.AddWithValue("@R3", string.IsNullOrEmpty(R3.Text) ? "P" : R3.Text);
        cm.Parameters.AddWithValue("@R4", string.IsNullOrEmpty(R4.Text) ? "P" : R4.Text);

        cm.Parameters.AddWithValue("@Ronda", string.IsNullOrEmpty(Ronda.Text) ? (object)DBNull.Value : int.Parse(Ronda.Text));
        cm.Parameters.AddWithValue("@Mesa", string.IsNullOrEmpty(Mesa.Text) ? (object)DBNull.Value : int.Parse(Mesa.Text));

        // IMPORTANTE: Agregar la fecha de la partida (columna obligatoria)
        // Opción 1: Si tienes un control de fecha, usarlo
        // cm.Parameters.AddWithValue("@Fecha", FechaPartida.Value.Date);
        // Opción 2: Usar la fecha actual
        cm.Parameters.AddWithValue("@Fecha", DateTime.Now.Date);

        cm.Parameters.AddWithValue("@FechaRegistro", DateTime.Parse(FechaR.Text));

        cm.Parameters.AddWithValue("@Pts1", string.IsNullOrEmpty(Pts1.Text) ? 0 : int.Parse(Pts1.Text));
        cm.Parameters.AddWithValue("@Pts2", string.IsNullOrEmpty(Pts2.Text) ? 0 : int.Parse(Pts2.Text));
        cm.Parameters.AddWithValue("@Pts3", string.IsNullOrEmpty(Pts3.Text) ? 0 : int.Parse(Pts3.Text));
        cm.Parameters.AddWithValue("@Pts4", string.IsNullOrEmpty(Pts4.Text) ? 0 : int.Parse(Pts4.Text));

        cm.Parameters.AddWithValue("@Usuario", CUsuario.Text);

        cm.Parameters.AddWithValue("@TJ1", string.IsNullOrEmpty(TJ1) ? (object)DBNull.Value : TJ1);
        cm.Parameters.AddWithValue("@TJ2", string.IsNullOrEmpty(TJ2) ? (object)DBNull.Value : TJ2);
        cm.Parameters.AddWithValue("@TJ3", string.IsNullOrEmpty(TJ3) ? (object)DBNull.Value : TJ3);
        cm.Parameters.AddWithValue("@TJ4", string.IsNullOrEmpty(TJ4) ? (object)DBNull.Value : TJ4);

        cm.ExecuteNonQuery();

        MessageBox.Show("Partida Registrada", "US", MessageBoxButtons.OK, MessageBoxIcon.Information);

        return true;
    }
    catch (FormatException ex)
    {
        MessageBox.Show("Error en el formato de los datos: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        return false;
    }
    catch (MySqlException ex)
    {
        MessageBox.Show("Error de base de datos: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        return false;
    }
    catch (Exception ex)
    {
        MessageBox.Show("Error inesperado: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        return false;
    }
}

// ===================================================================
// VERSIÓN ALTERNATIVA CON MÉTODO DE VALIDACIÓN
// ===================================================================

// Método auxiliar para validar antes de insertar (opcional pero recomendado)
private bool ValidarDatosPartida()
{
    if (Torneo.SelectedValue == null)
    {
        MessageBox.Show("Debe seleccionar un torneo", "Validación", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return false;
    }

    if (string.IsNullOrEmpty(ID1.Text) || string.IsNullOrEmpty(ID2.Text))
    {
        MessageBox.Show("Debe seleccionar al menos 2 jugadores", "Validación", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return false;
    }

    if (string.IsNullOrEmpty(Ronda.Text) || string.IsNullOrEmpty(Mesa.Text))
    {
        MessageBox.Show("Debe especificar la ronda y mesa", "Validación", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return false;
    }

    return true;
}

// ===================================================================
// COMPARACIÓN: CÓDIGO ANTERIOR VS CÓDIGO NUEVO
// ===================================================================
/*
CÓDIGO ANTERIOR (INSEGURO):
❌ INSERT INTO Partida (Id_torneo, Id_J1, ...) VALUES ('" + Torneo.SelectedValue + "', ...)
   - Vulnerable a SQL Injection
   - Nombres de columnas incorrectos
   - Sin validación de datos
   - Falta columna obligatoria "Fecha"

CÓDIGO NUEVO (SEGURO):
✅ INSERT INTO partida (Id_Torneo, Id_Jugador1, ...) VALUES (@IdTorneo, @IdJugador1, ...)
   - Protegido con parámetros
   - Nombres de columnas correctos
   - Validación de datos NULL/vacíos
   - Incluye columna "Fecha"
   - Mejor manejo de errores
*/
