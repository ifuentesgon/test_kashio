# gherkin: es
Característica: Gestión del Catálogo de Productos en FakeStoreAPI
  Como sistema de E-Commerce
  Necesito gestionar el catálogo de productos a través de la API
  Para que los clientes puedan visualizar el inventario y comprar de forma segura

  @smoke @regression
  Escenario: Consultar el catálogo completo de productos
    Dado que el servicio de FakeStoreAPI está disponible
    Cuando realizo una petición GET para obtener todos los productos
    Entonces la respuesta debe tener un código de estado 200
    Y la lista de productos debe ser mayor a 0
    Y cada producto debe contener los campos requeridos y tipos de datos válidos (id, title, price)

  @smoke @regression
  Escenario: Agregar un nuevo producto con datos válidos
    Dado que el servicio de FakeStoreAPI está disponible
    Y tengo un payload válido con un producto nuevo a "$150.50"
    Cuando realizo una petición POST para crear el producto
    Entonces la respuesta debe tener un código de estado 200
    Y el cuerpo de la respuesta debe contener el ID generado

  @smoke @regression
  Escenario: Control de Fraude - Rechazar creación de producto con precio negativo
    Dado que el servicio de FakeStoreAPI está disponible
    Y tengo un payload de producto con un precio inválido de "-500"
    Cuando realizo una petición POST para crear el producto
    Entonces el sistema debería rechazar la operación con un error estructural
    # Nota técnica: Esperaremos que el sistema maneje el error (ej. HTTP 400). 
    # Si devuelve 200, es un bug de validación del backend que reportaremos.