const request = require("supertest");
const server = require("./index"); // reemplaza con la ruta correcta de tu archivo

describe("Operaciones CRUD de posts", () => {

    // // Req 1: Obtener todos los posts
    // it('GET /posts debería devolver un status 200 y un arreglo', async () => {
    //     const res = await request(server).get('/posts');
    //     expect(res.statusCode).toEqual(200);
    //     expect(Array.isArray(res.body)).toBe(true);
    // });

    // // Req 2: Crear un nuevo post
    // it("Creando un nuevo post", async () => {
    //     const post = {
    //         description: "Descripción del post"
    //     };
    //     const { body, statusCode } = await request(server).post("/posts").send(post);
    //     expect(statusCode).toBe(201);
    //     expect(body.message).toBe("Post creado exitosamente");
    // });

    // // Req 3: Editar un post que no existe
    // it("Editando un post que no existe", async () => {
    //     const id = "id_que_no_existe";
    //     const post = {
    //         description: "Nueva descripción del post"
    //         // img: si quieres probar la actualización de la imagen, deberías proporcionarla aquí
    //     };
    //     const { statusCode } = await request(server).put(`/posts/${id}`).send(post);
    //     expect(statusCode).toBe(400); // o el código que retornes cuando algo falla
    // });

    // // Req 4: Eliminar un post que no existe
    // it("Eliminando un post que no existe", async () => {
    //     const id = "id_que_no_existe";
    //     const { statusCode } = await request(server).delete(`/posts/${id}`).send();
    //     expect(statusCode).toBe(404);
    // });
    // it("Error al eliminar un post debido a un problema", async () => {
    //     // Simula el error (usando mocks o cambiando temporalmente el código).
    //     const id = "id_cualquiera";
    //     const { statusCode, body } = await request(server).delete(`/posts/${id}`).send();
    //     expect(statusCode).toBe(404);
    //     expect(body.msg).toMatch(/^Error al eliminar el post/);
    // });

    it('should return 401 if the user does not exist', async () => {
        const res = await request(server)
            .post('/login')
            .send({
                username: 'nonexistentuser',
                password: 'randompassword'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body).toEqual("Usuario o contraseña inválida");
    });
    it('should register a new user and return the user data without password', async () => {
        const res = await request(server)
            .post('/register')
            .send({
                username: 'jhonaa@gmail.com',
                password: '123456'
            });
        expect(res.statusCode).toEqual(200);
    });


});

