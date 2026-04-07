// src/components/UserForm.js
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import api from "../api/axiosConfig";

const EMPTY_FORM = {
  nombres: "",
  apellidos: "",
  email: "",
  telefono: "",
  tipo_usuario: ""
};

function UserForm({ userToEdit, onSaveComplete }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nombres: userToEdit.nombres || "",
        apellidos: userToEdit.apellidos || "",
        email: userToEdit.email || "",
        telefono: userToEdit.telefono || "",
        tipo_usuario: userToEdit.tipo_usuario || userToEdit.rol || ""
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.email.trim() || !formData.tipo_usuario) {
      return Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Completa nombres, apellidos, correo y tipo de usuario."
      });
    }

    if (!formData.email.includes("@")) {
      return Swal.fire({
        icon: "warning",
        title: "Correo invalido",
        text: 'Incluye un "@" en la direccion de correo.',
        confirmButtonColor: "#1a73e8"
      });
    }

    const payload = {
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      email: formData.email.trim().toLowerCase(),
      telefono: formData.telefono?.trim() || "",
      tipo_usuario: formData.tipo_usuario
    };

    try {
      const userId = userToEdit?.id_usuarios || userToEdit?.id;
      const url = userId ? `/usuarios/${userId}` : "/usuarios";

      if (userId) {
        await api.put(url, payload);
      } else {
        await api.post(url, payload);
      }

      Swal.fire({
        icon: "success",
        title: userId ? "Actualizado" : "Registrado",
        text: "Operacion realizada con exito",
        timer: 2000,
        showConfirmButton: false
      });

      if (onSaveComplete) onSaveComplete();
      if (!userId) setFormData(EMPTY_FORM);
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      Swal.fire(
        "Error",
        serverMessage || "No se pudo conectar con el servidor",
        "error"
      );
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