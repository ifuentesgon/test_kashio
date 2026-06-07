import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Prueba de Estrés: Subidas agresivas y escalonadas para encontrar el punto de quiebre
    stages: [
        { duration: '10s', target: 10 },   // Carga normal
        { duration: '15s', target: 50 },   // Carga alta
        { duration: '15s', target: 100 },  // Estrés: Aquí esperamos que el API empiece a lanzar errores 429
        { duration: '10s', target: 0 },    // Recuperación
    ],
    thresholds: {
        // En estrés, permitimos que el p95 suba a 2 segundos antes de fallar el pipeline
        http_req_duration: ['p(95)<2000'],
    },
};

// Lee el token desde la línea de comandos
const TOKEN = __ENV.GOREST_TOKEN;

export default function () {
    const url = 'https://gorest.co.in/public/v2/users';
    
    // Generamos un email dinámico único por cada "Virtual User" (VU) y por iteración
    const randomId = Math.floor(Math.random() * 10000000);
    const payload = JSON.stringify({
        name: `Usuario Estrés ${randomId}`,
        gender: 'male',
        email: `stress_kashio_${__VU}_${__ITER}_${randomId}@domain.com`,
        status: 'active'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`,
        },
    };

    const res = http.post(url, payload, params);

    // Validamos cómo responde el sistema bajo presión
    check(res, {
        'creado exitosamente (201)': (r) => r.status === 201,
        'alcanzó el rate limit (429)': (r) => r.status === 429,
    });

    // Poco tiempo de espera para saturar el servidor rápidamente
    sleep(0.5);
}