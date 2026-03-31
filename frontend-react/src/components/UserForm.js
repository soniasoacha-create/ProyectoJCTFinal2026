// src/components/UserForm.js
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2"; // ✅ Importamos SweetAlert2

// MODIFICACIÓN: Se cambia onFormSubmit por onSaveComplete para coincidir con App.js
function UserForm({ userToEdit, onSaveComplete }) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    tipo_usuario: ""
  });

  // Efecto para cargar datos en caso de edición
  useEffect(() => {
    if (userToEdit) {
      setFormData(userToEdit);
    } else {
      setFormData({ nombres: "", apellidos: "", email: "", telefono: "", tipo_usuario: "" });
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validación manual en español antes de enviar
    if (!formData.email.includes("@")) {
      return Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Por favor, incluye un "@" en la dirección de correo.',
        confirmButtonColor: '#1a73e8'
      });
    }

    try {
      const method = userToEdit ? "PUT" : "POST";
      const url = userToEdit 
        ? `/api/usuarios/${userToEdit.id_usuarios}`
        : "/api/usuarios";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Alerta visual de éxito (Recuadro verde)
        Swal.fire({
          icon: 'success',
          title: userToEdit ? '¡Actualizado!' : '¡Registrado!',
          text: data.message || "Operación realizada con éxito",
          timer: 2000,
          showConfirmButton: false
        });
        
        // MODIFICACIÓN: Llamada a la prop correcta para refrescar la lista
        if (onSaveComplete) onSaveComplete(); 
        
        if (!userToEdit) setFormData({ nombres: "", apellidos: "", email: "", telefono: "", tipo_usuario: "" });
      } else {
        // ✅ Alerta de error del servidor (Recuadro rojo)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || "Hubo un problema al procesar la solicitud"
        });
      }
    } catch (err) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  };

  return (
    <div className="form-container">
      <h2>{userToEdit ? "Editar Usuario" : "Agregar Usuario"}</h2>
      
      {/* Usamos noValidate para evitar los globos en inglés del navegador */}
      <form onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          name="nombres"
          placeholder="Nombres"
          value={formData.nombres}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="apellidos"
          placeholder="Apellidos"
          value={formData.apellidos}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={handleChange}
        />
        
        <select 
          name="tipo_usuario" 
          value={formData.tipo_usuario} 
          onChange={handleChange}
          required
        >
          <option value="">Seleccione Tipo de Usuario</option>
          <option value="cliente">Cliente</option>
          <option value="administrador">Administrador</option>
          <option value="moderador">Moderador</option>
        </select>

        <button type="submit" className="btn-primary">
          {userToEdit ? "Actualizar" : "Guardar"}
        </button>
      </form>
    </div>
  );
}

export default UserForm;