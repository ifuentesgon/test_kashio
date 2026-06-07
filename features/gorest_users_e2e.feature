# gherkinnsa: es
Característica: Gestión E2E del Ciclo de Vida de Usuarios en GoRest
  Como administrador del sistema
  Necesito registrar usuarios, actualizar su información y validar duplicidad
  Para asegurar la integridad de los datos en la plataforma

  Escenario: Ciclo de vida completo (Crear, Actualizar y Consultar)
    Dado que genero datos dinámicos para un nuevo usuario en GoRest
    Cuando realizo una petición POST para crear el usuario
    Entonces la respuesta debe ser exitosa y guardar el ID generado
    Cuando actualizo el estado del usuario a "inactive"
    Y consulto los datos del usuario por su ID
    Entonces los datos devueltos deben reflejar el estado "inactive"

  Escenario: Prevenir creación de usuarios con correos duplicados
    Dado que intento utilizar el mismo correo generado anteriormente
    Cuando realizo una petición POST para crear el usuario
    Entonces el sistema debe rechazar la creación con un error 422
    Y el mensaje de error debe indicar que el email ya existe