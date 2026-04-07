import React, { useEffect, useRef, useState } from "react";
import UserForm from "../components/UserForm";
import UserList from "../components/UserList";

function UsuariosPage() {
  const [userToEdit, setUserToEdit] = useState(null);
  const [refreshListToggle, setRefreshListToggle] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    if (userToEdit && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [userToEdit]);

  const handleUserEdit = (user) => {
    setUserToEdit(user);
  };

  const handleSaveComplete = () => {
    setUserToEdit(null);
    setRefreshListToggle((currentValue) => currentValue + 1);
  };

  const handleCancelEdit = () => {
    setUserToEdit(null);
  };

  return (
    <>
      {userToEdit && (
        <div ref={formRef} className="container-xl pt-4 pb-0">
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleCancelEdit}
            >
              Cerrar edicion
            </button>
          </div>
          <UserForm
            userToEdit={userToEdit}
            onSaveComplete={handleSaveComplete}
          />
        </div>
      )}

      <UserList
        onUserEdit={handleUserEdit}
        refreshListToggle={refreshListToggle}
      />
    </>
  );
}

export default UsuariosPage;