import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuración de la Carga (Stages) y Umbrales (Thresholds)
export const options = {
    stages: [
        { duration: '10s', target: 20 },  // Rampa de subida: de 0 a 20 usuarios en 10s
        { duration: '30s', target: 20 },  // Mantenimiento: se quedan 20 usuarios por 30s
        { duration: '10s', target: 0 },   // Rampa de bajada: vuelven a 0
    ],
    thresholds: {
        // El 95% de las peticiones deben responder en menos de 500ms
        http_req_duration: ['p(95)<500'],
        // La tasa de error debe ser menor al 1%
        http_req_failed: ['rate<0.01'],
    },
};

// 2. Ejecución de la Prueba
export default function () {
    const url = 'https://fakestoreapi.com/products';
    const res = http.get(url);

    // 3. Validaciones de negocio en k6
    check(res, {
        'status es 200': (r) => r.status === 200,
        'devuelve array de productos': (r) => r.json().length > 0,
    });

    // Simulamos el tiempo de lectura o "Think Time" de un usuario real (1 segundo)
    sleep(1);
}