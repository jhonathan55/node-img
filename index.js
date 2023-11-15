const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Swagger Docs import
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
// Definición de las opciones para multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(file.originalname);
    }
});
// Definición de las opciones para swaggerJsdoc
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Ejemplo',
            version: '1.0.0',
            description: 'Esta es una API de ejemplo creada con Express y documentada con Swagger',
            termsOfService: 'http://tu-sitio-web.com/terms',
            contact: {
                name: 'Jhonathan Gutierrez',
                url: 'http://tu-sitio-web.com',
                email: 'jfgutierrezsaico@gmail.com'
            },
            license: {
                name: 'MIT',
                url: 'http://tu-sitio-web.com/license'
            },
        },
        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Servidor de desarrollo'
            },
            {
                url: 'http://miapp.cl',
                description: 'Servidor de productivo'
            },
            // otros servidores...
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: {
                            type: 'string',
                            example: 'user1',
                        },
                        password: {
                            type: 'string',
                            example: 'pass123',
                        },
                        // roles:{
                        //     type:'string',
                        //     example:'admin'
                        // }
                    }
                },
                Equipo: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            format: 'int64',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            example: 'Equipo A'
                        }
                    }
                }
            },
            parameters: {
                // parámetros globales aquí...
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Autenticación',
                description: 'Rutas para autenticación de usuarios'
            },
        ],
        externalDocs: {
            description: 'Encuentra más información aquí',
            url: 'http://tu-sitio-web.com/docs'
        },
        paths: {
            '/register': {
                post: {
                    summary: 'Registra un nuevo usuario',
                    tags: ['Usuarios'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Usuario registrado exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/User'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Entrada inválida, objeto usuario incorrecto'
                        },
                        '500': {
                            description: 'Error del servidor'
                        }
                    }
                }
            },
            '/login': {
                post: {
                    summary: 'Autentica a un usuario y devuelve un token JWT',
                    tags: ['Autenticación'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Autenticación exitosa, token provisto',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: {
                                                type: 'string',
                                                description: 'JWT Token para autenticación'
                                            },
                                            msg: {
                                                type: 'string',
                                                description: 'Mensaje de autenticación exitosa'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Credenciales inválidas'
                        },
                        '500': {
                            description: 'Error del servidor'
                        }
                    }
                }
            },
            '/equipos': {
                get: {
                    summary: 'Obtiene una lista de equipos',
                    tags: ['Equipos'],
                    responses: {
                        '200': {
                            description: 'Lista de equipos obtenida exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/Equipo'
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Error del servidor'
                        }
                    }
                }
            },
                        
        },
    },
    apis: ['./routes/*.js']
};


// Inicialización de las especificaciones de swaggerJsdoc con las opciones definidas
const specs = swaggerJsDoc(swaggerOptions);

const upload = multer({ storage: storage });
// Habilitar CORS
app.use(cors());
app.use(express.json());
const server = app.listen(3002, () => {
    console.log('Servidor iniciado en el puerto 3002');
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/uploads', express.static('uploads'));
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'new',
    password: 'root',
    port: 5432,
    allowExitOnIdle: true
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo cliente', err.stack)
    }
    console.log('Conectado con éxito');
})

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} a ${req.url}`);
    next();
});

function verifyToken(req, res, next) {
    // Obtener el token de las cabeceras
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const token = bearer[1];
        // Verificar el token
        jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'Token no válido' });
            }
            // Si el token es válido, almacenar payload en req.decoded para su posterior uso
            req.decoded = decoded;
            next();  // continuar con la siguiente función en la cadena
        });
    } else {
        return res.status(401).send({ message: 'Token no provisto' });
    }
}
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Error en el servidor
 */
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Guardar el usuario en la base de datos
        const newUser = await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
            [username, hashedPassword]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentica a un usuario y devuelve un token JWT.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           examples:
 *             application/json: {
 *               username: "user_example",
 *               password: "password_example"
 *             }
 *     responses:
 *       200:
 *         description: Autenticación exitosa, devuelve un token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: El token JWT para autenticación.
 *                 msg:
 *                   type: string
 *                   description: Mensaje de autenticación exitosa.
 *             examples:
 *               application/json: {
 *                 token: "jwt_token_example",
 *                 msg: "Autenticado exitosamente"
 *               }
 *       401:
 *         description: Autenticación fallida debido a credenciales inválidas.
 *       500:
 *         description: Error del servidor al procesar la solicitud.
 */

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Comprobar si el usuario existe
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if (user.rows.length === 0) {
            return res.status(401).json("Usuario o contraseña inválida");
        }

        // Comparar la contraseña proporcionada con la almacenada en la base de datos
        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(401).json({ msg: "Usuario o contraseña inválida" });
        }

        // Generar un token JWT
        const token = jwt.sign(
            { userId: user.rows[0].id, username: user.rows[0].username },
            'SECRET_KEY',
            { expiresIn: '1h' }
        );

        res.json({ token, msg: "Autenticado exitosamente" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autentica a un usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario autenticado exitosamente
 *       401:
 *         description: Usuario o contraseña inválidos
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Comprobar si el usuario existe
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (user.rows.length === 0) {
            return res.status(401).json("Usuario o contraseña inválida");
        }
        // Comparar la contraseña proporcionada con la almacenada en la base de datos
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json("Usuario o contraseña inválida");
        }
        res.json("Autenticado exitosamente");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});

//

app.get('/equipos', async (req, res) => {
    try {
        const results = await pool.query("SELECT id, name FROM equipos");
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});
//
app.get('/equipos/:teamID/jugadores', async (req, res) => {
    try {
        const { teamID } = req.params;
        const query = `
            SELECT jugadores.name, posiciones.name AS posicion
            FROM jugadores 
            INNER JOIN posiciones ON jugadores.id_posiciones = posiciones.id
            WHERE jugadores.id_equipos = $1
        `;

        const results = await pool.query(query, [teamID]);
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});

//crud img
app.get('/posts', verifyToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM post');
        if (result.rows.length === 0) return res.status(404).json({ message: "No hay posts" });
        res.status(200).json(result.rows);
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al obtener datos");
    }
});

app.post('/posts', upload.single('img'), async (req, res) => {
    try {
        const { description } = req.body;
        console.log(description);
        // const img = req.file.path; // Esta es la ruta de la imagen guardada
        const client = await pool.connect();
        const sql = "INSERT INTO post (description) VALUES ($1)";
        const values = [description];
        await client.query(sql, values);
        res.status(201).json({ message: "Post creado exitosamente" });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send({ msg: "Error al insertar datos" + err });
    }
});

app.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        // Obtener la URL de la imagen del post que se quiere eliminar
        const { rows } = await client.query("SELECT url FROM post WHERE id=$1", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Post no encontrado" });
        }
        // Eliminar la imagen de la carpeta 'uploads'
        const sql = "DELETE FROM post WHERE id=$1";
        await client.query(sql, [id]);
        res.status(200).json({ message: "Post eliminado exitosamente" });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send({ msg: "Error al eliminar el post" + err });
    }
});

app.put('/posts/:id', upload.single('img'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "No se ha enviado el id" });
        const { description } = req.body;
        const img = req.file ? req.file.path : null;
        const client = await pool.connect();
        if (img) {
            const sql = "UPDATE post SET url=$1, description=$2 WHERE id=$3";
            const values = [description, id];
            await client.query(sql, values);
        } else {
            const sql = "UPDATE post SET description=$1 WHERE id=$2";
            const values = [description, id];
            await client.query(sql, values);
        }
        res.json({ message: "Post actualizado exitosamente" });
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error al actualizar datos");
    }
});

module.exports = app;
