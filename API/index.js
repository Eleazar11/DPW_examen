import mysql2 from "mysql2";
import express from "express";
import bodyParser from "body-parser";

const connection = mysql2.createConnection({
    host: "localhost",
    database: "CarritoCompras",
    user: "root",
    password: "",
});

const app = express();

app.use(bodyParser.json());

const PORT = 5000;

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
        return;
    }
    console.log("Base de datos conectada!");
});

//rutas para los usuarios
app.post("/usuarios", (req, res) => {
    const { username, nombre_completo, direccion } = req.body;

    if (!username || !nombre_completo || !direccion) {
        return res.status(400).send("Todos los campos son obligatorios: username, nombre_completo, direccion");
    }

    const query = "INSERT INTO Usuarios (username, nombre_completo, direccion) VALUES (?, ?, ?)";
    connection.query(query, [username, nombre_completo, direccion], (err, result) => {
        if (err) {
            console.error("Error al agregar el usuario:", err.message);
            return res.status(500).send("Error al agregar el usuario");
        }
        res.status(201).send("Usuario agregado con éxito");
    });
});

app.get("/usuarios", (req, res) => {
    const query = "SELECT * FROM Usuarios";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener los usuarios:", err.message);
            return res.status(500).send("Error al obtener los usuarios");
        }
        res.json(results);
    });
});

app.put("/usuarios/:id", (req, res) => {
    const { id } = req.params;
    const { username, nombre_completo, direccion } = req.body;

    if (!username && !nombre_completo && !direccion) {
        return res.status(400).send("Debe proporcionar al menos un campo para actualizar: username, nombre_completo o direccion");
    }

    const fieldsToUpdate = [];
    if (username) fieldsToUpdate.push(`username = '${username}'`);
    if (nombre_completo) fieldsToUpdate.push(`nombre_completo = '${nombre_completo}'`);
    if (direccion) fieldsToUpdate.push(`direccion = '${direccion}'`);

    const query = `UPDATE Usuarios SET ${fieldsToUpdate.join(", ")} WHERE id_usuario = ?`;
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al actualizar el usuario:", err.message);
            return res.status(500).send("Error al actualizar el usuario");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Usuario no encontrado");
        }

        res.send("Usuario actualizado con éxito");
    });
});

//ruta para los productos
app.post("/productos", (req, res) => {
    const { nombre_producto, precio_unitario, cantidad_existencia } = req.body;

    if (!nombre_producto || !precio_unitario || !cantidad_existencia) {
        return res.status(400).send("Todos los campos son obligatorios: nombre_producto, precio_unitario, cantidad_existencia");
    }

    const query = "INSERT INTO Productos (nombre_producto, precio_unitario, cantidad_existencia) VALUES (?, ?, ?)";
    connection.query(query, [nombre_producto, precio_unitario, cantidad_existencia], (err, result) => {
        if (err) {
            console.error("Error al agregar el producto:", err.message);
            return res.status(500).send("Error al agregar el producto");
        }
        res.status(201).send("Producto agregado con éxito");
    });
});

app.get("/productos", (req, res) => {
    const query = "SELECT * FROM Productos";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error al obtener los productos:", err.message);
            return res.status(500).send("Error al obtener los productos");
        }
        res.json(results);
    });
});

app.put("/productos/:id", (req, res) => {
    const { id } = req.params;
    const { nombre_producto, precio_unitario, cantidad_existencia } = req.body;

    if (!nombre_producto && !precio_unitario && !cantidad_existencia) {
        return res.status(400).send("Debe proporcionar al menos un campo para actualizar: nombre_producto, precio_unitario o cantidad_existencia");
    }

    const fieldsToUpdate = [];
    if (nombre_producto) fieldsToUpdate.push(`nombre_producto = '${nombre_producto}'`);
    if (precio_unitario) fieldsToUpdate.push(`precio_unitario = ${precio_unitario}`);
    if (cantidad_existencia) fieldsToUpdate.push(`cantidad_existencia = ${cantidad_existencia}`);

    const query = `UPDATE Productos SET ${fieldsToUpdate.join(", ")} WHERE id_producto = ?`;
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error al actualizar el producto:", err.message);
            return res.status(500).send("Error al actualizar el producto");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Producto no encontrado");
        }

        res.send("Producto actualizado con éxito");
    });
});

//ruta para los carritos
// Agregar producto al carrito
app.post('/carrito/agregar', (req, res) => {
    const { identificador_carrito, id_usuario, id_producto, cantidad } = req.body;

    // Obtener el precio del producto
    connection.query('SELECT precio_unitario FROM Productos WHERE id_producto = ?', [id_producto], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const precio_unitario = result[0].precio_unitario;
        const subtotal = precio_unitario * cantidad;

        // Insertar en la tabla Carrito
        connection.query(
            'INSERT INTO Carrito (identificador_carrito, id_usuario, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?, ?)',
            [identificador_carrito, id_usuario, id_producto, cantidad, subtotal],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Producto agregado al carrito', id_carrito: result.insertId });
            }
        );
    });
});


// Ver productos en un carrito
app.get('/carrito/:identificador_carrito', (req, res) => {
    const { identificador_carrito } = req.params;

    connection.query(
        'SELECT c.id_carrito, p.nombre_producto, c.cantidad, c.subtotal, c.fecha_creacion FROM Carrito c JOIN Productos p ON c.id_producto = p.id_producto WHERE c.identificador_carrito = ?',
        [identificador_carrito],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'No se encontraron productos en este carrito' });
            }

            res.json(result);
        }
    );
});

// Editar cantidad de un producto en el carrito
app.put('/carrito/editar/:id_carrito', (req, res) => {
    const { id_carrito } = req.params;
    const { cantidad } = req.body;

    // Obtener el precio del producto
    connection.query('SELECT id_producto FROM Carrito WHERE id_carrito = ?', [id_carrito], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        const id_producto = result[0].id_producto;

        // Obtener el precio unitario del producto
        connection.query('SELECT precio_unitario FROM Productos WHERE id_producto = ?', [id_producto], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const precio_unitario = result[0].precio_unitario;
            const subtotal = precio_unitario * cantidad;

            // Actualizar la cantidad y subtotal en la tabla Carrito
            connection.query(
                'UPDATE Carrito SET cantidad = ?, subtotal = ? WHERE id_carrito = ?',
                [cantidad, subtotal, id_carrito],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Producto actualizado en el carrito' });
                }
            );
        });
    });
});

// Eliminar un producto del carrito
app.delete('/carrito/eliminar/:id_carrito', (req, res) => {
    const { id_carrito } = req.params;

    // Eliminar el producto del carrito
    connection.query('DELETE FROM Carrito WHERE id_carrito = ?', [id_carrito], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
        }

        res.json({ message: 'Producto eliminado del carrito' });
    });
});

//rutas para eliminar sin problemas con las fk
// Eliminar un usuario y sus productos en el carrito
app.delete('/usuarios/:id_usuario', (req, res) => {
    const { id_usuario } = req.params;

    // Eliminar productos del carrito del usuario
    const deleteCarritoQuery = 'DELETE FROM Carrito WHERE id_usuario = ?';

    connection.query(deleteCarritoQuery, [id_usuario], (err, result) => {
        if (err) {
            console.error("Error al eliminar productos del carrito:", err.message);
            return res.status(500).send("Error al eliminar productos del carrito.");
        }

        // Eliminar el usuario después de eliminar los productos del carrito
        const deleteUserQuery = 'DELETE FROM Usuarios WHERE id_usuario = ?';

        connection.query(deleteUserQuery, [id_usuario], (err, result) => {
            if (err) {
                console.error("Error al eliminar el usuario:", err.message);
                return res.status(500).send("Error al eliminar el usuario.");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("Usuario no encontrado.");
            }

            res.send("Usuario y sus productos en el carrito eliminados con éxito.");
        });
    });
});

// Eliminar un producto y sus registros en el carrito
app.delete('/productos/:id_producto', (req, res) => {
    const { id_producto } = req.params;

    // Eliminar el producto del carrito
    const deleteCarritoQuery = 'DELETE FROM Carrito WHERE id_producto = ?';

    connection.query(deleteCarritoQuery, [id_producto], (err, result) => {
        if (err) {
            console.error("Error al eliminar producto del carrito:", err.message);
            return res.status(500).send("Error al eliminar producto del carrito.");
        }

        // Ahora eliminar el producto de la tabla Productos
        const deleteProductQuery = 'DELETE FROM Productos WHERE id_producto = ?';

        connection.query(deleteProductQuery, [id_producto], (err, result) => {
            if (err) {
                console.error("Error al eliminar el producto:", err.message);
                return res.status(500).send("Error al eliminar el producto.");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("Producto no encontrado.");
            }

            res.send("Producto y sus registros en el carrito eliminados con éxito.");
        });
    });
});


// Ruta de prueba
app.use("/", (req, res) => {
    res.send("Hola mundo de la API de heladería");
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Corriendo en: http://localhost:${PORT}`);
});
