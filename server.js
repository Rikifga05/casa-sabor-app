const express = require("express");
require("dotenv").config();

const db = require("./database/database");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ========================================
// CONFIGURACIÓN DE MULTER
// ========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(
            null,
            path.join(__dirname, "public", "images")
        );

    },

    filename: (req, file, cb) => {

        const extension =
            file.originalname.split(".").pop();

        const filename =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            "." +
            extension;

        cb(null, filename);

    }

});

const imagesPath =
    path.join(__dirname, "public", "images");

if (!fs.existsSync(imagesPath)) {

    fs.mkdirSync(
        imagesPath,
        { recursive: true }
    );

}

const upload = multer({
    storage: storage
});


// ========================================
// CREAR APLICACIÓN
// ========================================

const app = express();

app.set("trust proxy", 1);

const PORT =
    process.env.PORT || 3000;


// ========================================
// CONFIGURACIÓN
// ========================================

app.use(express.json());


// ========================================
// CONFIGURAR SESIONES
// ========================================

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        httpOnly: true,

        secure:
            process.env.NODE_ENV === "production",

        sameSite: "lax",

        maxAge:
            1000 * 60 * 60

    }

}));


// ========================================
// PROTEGER RUTAS DE ADMINISTRACIÓN
// ========================================

function requireLogin(req, res, next) {

    if (!req.session.user) {

        return res.status(401).json({

            error: "No autorizado"

        });

    }

    next();

}


// ========================================
// PROTEGER PANEL DE ADMINISTRACIÓN
// ========================================

app.get("/admin.html", (req, res, next) => {

    if (!req.session.user) {

        return res.redirect("/login.html");

    }

    next();

});


// ========================================
// SERVIR ARCHIVOS PÚBLICOS
// ========================================

app.use(express.static("public"));


// ========================================
// FUNCIONES AUXILIARES DE TURSO
// ========================================

async function getOne(sql, args = []) {

    const result =
        await db.execute({
            sql: sql,
            args: args
        });

    return result.rows[0] || null;

}


async function getAll(sql, args = []) {

    const result =
        await db.execute({
            sql: sql,
            args: args
        });

    return result.rows;

}


async function execute(sql, args = []) {

    return await db.execute({

        sql: sql,

        args: args

    });

}


// ========================================
// INICIALIZAR BASE DE DATOS
// ========================================

async function initializeDatabase() {

    // ========================================
    // TABLA DE PRODUCTOS
    // ========================================

    await execute(`
        CREATE TABLE IF NOT EXISTS products (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            description TEXT,

            price REAL NOT NULL,

            image TEXT,

            available INTEGER DEFAULT 1,

            category TEXT DEFAULT 'Platos principales'

        )
    `);


    // ========================================
    // TABLA DE PEDIDOS
    // ========================================

    await execute(`
        CREATE TABLE IF NOT EXISTS orders (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            customer_name TEXT NOT NULL,

            customer_phone TEXT NOT NULL,

            customer_address TEXT NOT NULL,

            total REAL NOT NULL,

            status TEXT DEFAULT 'Pendiente',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )
    `);


    // ========================================
    // PRODUCTOS DE LOS PEDIDOS
    // ========================================

    await execute(`
        CREATE TABLE IF NOT EXISTS order_items (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            order_id INTEGER NOT NULL,

            product_id INTEGER NOT NULL,

            product_name TEXT NOT NULL,

            quantity INTEGER NOT NULL,

            price REAL NOT NULL,

            subtotal REAL NOT NULL,

            FOREIGN KEY (order_id)
                REFERENCES orders(id)

        )
    `);


    // ========================================
    // TABLA DE USUARIOS
    // ========================================

    await execute(`
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            username TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL

        )
    `);


    // ========================================
    // CONFIGURACIÓN DEL RESTAURANTE
    // ========================================

    await execute(`
        CREATE TABLE IF NOT EXISTS restaurant_settings (

            id INTEGER PRIMARY KEY,

            name TEXT NOT NULL,

            main_title TEXT DEFAULT '',

            main_subtitle TEXT DEFAULT '',

            description TEXT DEFAULT '',

            phone TEXT DEFAULT '',

            whatsapp TEXT DEFAULT '',

            address TEXT DEFAULT '',

            hours TEXT DEFAULT '',

            button_text TEXT DEFAULT '',

            secondary_button_text TEXT DEFAULT '',

            menu_subtitle TEXT DEFAULT '',

            menu_title TEXT DEFAULT '',

            menu_description TEXT DEFAULT '',

            about_subtitle TEXT DEFAULT '',

            about_title TEXT DEFAULT '',

            about_text TEXT DEFAULT '',

            about_text2 TEXT DEFAULT '',

            contact_subtitle TEXT DEFAULT '',

            contact_title TEXT DEFAULT '',

            contact_text TEXT DEFAULT ''

        )
    `);


    // ========================================
    // CREAR CONFIGURACIÓN INICIAL
    // ========================================

    const restaurantSettings =
        await getOne(`
            SELECT *
            FROM restaurant_settings
            WHERE id = 1
        `);


    if (!restaurantSettings) {

        await execute(`
            INSERT INTO restaurant_settings
            (
                id,
                name,
                main_title,
                main_subtitle,
                description,
                phone,
                whatsapp,
                address,
                hours,
                button_text,
                secondary_button_text,
                menu_subtitle,
                menu_title,
                menu_description,
                about_subtitle,
                about_title,
                about_text,
                about_text2,
                contact_subtitle,
                contact_title,
                contact_text
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `, [

            1,

            "Casa Sabor",

            "Sabor casero, hecho con amor",

            "BIENVENIDO A CASA SABOR",

            "Disfruta platos preparados con dedicación, ingredientes frescos y ese sabor que te hace sentir como en casa.",

            "",

            "",

            "",

            "",

            "Ver nuestro menú",

            "Contáctanos",

            "DESCUBRE NUESTROS SABORES",

            "Nuestro menú",

            "Elige tu plato favorito y disfruta de una experiencia llena de sabor.",

            "CONÓCENOS",

            "Sobre nosotros",

            "En Casa Sabor creemos que una buena comida no solo alimenta, también crea momentos.",

            "Preparamos cada plato con dedicación, buscando ofrecerte ese delicioso sabor casero que siempre quieres volver a disfrutar.",

            "ESTAMOS PARA TI",

            "Contáctanos",

            ""

        ]);

    }


    // ========================================
    // CREAR USUARIO ADMINISTRADOR
    // ========================================

    const userCount =
        await getOne(`
            SELECT COUNT(*) AS total
            FROM users
        `);


    if (Number(userCount.total) === 0) {

        const passwordHash =
            await bcrypt.hash(
                process.env.ADMIN_PASSWORD,
                10
            );


        await execute(`
            INSERT INTO users
            (username, password)
            VALUES (?, ?)
        `, [

            process.env.ADMIN_USERNAME,

            passwordHash

        ]);


        console.log(
            "Usuario administrador creado"
        );

    }


    // ========================================
    // CREAR PRODUCTO INICIAL
    // ========================================

    const productCount =
        await getOne(`
            SELECT COUNT(*) AS total
            FROM products
        `);


    if (Number(productCount.total) === 0) {

        await execute(`
            INSERT INTO products
            (name, description, price, category)
            VALUES (?, ?, ?, ?)
        `, [

            "Hamburguesa Casa",

            "Carne Angus, queso cheddar y salsa especial.",

            18.90,

            "Platos principales"

        ]);


        console.log(
            "Producto inicial creado"
        );

    }


    console.log(
        "Base de datos Turso inicializada correctamente"
    );

}


// ========================================
// POST - LOGIN
// ========================================

app.post("/api/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;


        if (!username || !password) {

            return res.status(400).json({

                error:
                    "Usuario y contraseña son obligatorios"

            });

        }


        const user =
            await getOne(`
                SELECT *
                FROM users
                WHERE username = ?
            `, [username]);


        if (!user) {

            return res.status(401).json({

                error:
                    "Usuario o contraseña incorrectos"

            });

        }


        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordCorrect) {

            return res.status(401).json({

                error:
                    "Usuario o contraseña incorrectos"

            });

        }


        req.session.user = {

            id: Number(user.id),

            username: user.username

        };


        res.json({

            message: "Login correcto",

            username: user.username

        });

    } catch (error) {

        console.error(
            "Error en login:",
            error
        );

        res.status(500).json({

            error:
                "Error interno del servidor"

        });

    }

});


// ========================================
// POST - CERRAR SESIÓN
// ========================================

app.post("/api/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            return res.status(500).json({

                error:
                    "No se pudo cerrar la sesión"

            });

        }


        res.json({

            message:
                "Sesión cerrada correctamente"

        });

    });

});


// ========================================
// PUT - CAMBIAR CONTRASEÑA
// ========================================

app.put(
    "/api/users/change-password",
    requireLogin,
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword
            } = req.body;


            if (!currentPassword || !newPassword) {

                return res.status(400).json({

                    error:
                        "La contraseña actual y la nueva contraseña son obligatorias"

                });

            }


            if (newPassword.length < 8) {

                return res.status(400).json({

                    error:
                        "La nueva contraseña debe tener al menos 8 caracteres"

                });

            }


            const user =
                await getOne(`
                    SELECT *
                    FROM users
                    WHERE id = ?
                `, [
                    req.session.user.id
                ]);


            if (!user) {

                return res.status(404).json({

                    error:
                        "Usuario no encontrado"

                });

            }


            const passwordCorrect =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );


            if (!passwordCorrect) {

                return res.status(401).json({

                    error:
                        "La contraseña actual es incorrecta"

                });

            }


            const newPasswordHash =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            await execute(`
                UPDATE users
                SET password = ?
                WHERE id = ?
            `, [

                newPasswordHash,

                user.id

            ]);


            res.json({

                message:
                    "Contraseña actualizada correctamente"

            });

        } catch (error) {

            console.error(
                "Error cambiando contraseña:",
                error
            );

            res.status(500).json({

                error:
                    "Error interno del servidor"

            });

        }

    }
);


// ========================================
// GET - OBTENER PRODUCTOS
// ========================================

app.get("/api/products", async (req, res) => {

    try {

        const products =
            await getAll(`
                SELECT *
                FROM products
                WHERE available = 1
                ORDER BY id DESC
            `);


        res.json(products);

    } catch (error) {

        console.error(
            "Error obteniendo productos:",
            error
        );

        res.status(500).json({

            error:
                "No se pudieron obtener los productos"

        });

    }

});


// ========================================
// GET - OBTENER TODOS LOS PRODUCTOS PARA ADMIN
// ========================================

app.get(
    "/api/admin/products",
    requireLogin,
    async (req, res) => {

        try {

            const products =
                await getAll(`
                    SELECT *
                    FROM products
                    ORDER BY id DESC
                `);


            res.json(products);

        } catch (error) {

            console.error(
                "Error obteniendo productos:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudieron obtener los productos"

            });

        }

    }
);


// ========================================
// PUT - EDITAR PRODUCTO
// ========================================

app.put(
    "/api/products/:id",
    requireLogin,
    upload.single("image"),
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                name,
                description,
                price,
                category
            } = req.body;


            if (!name || !price) {

                return res.status(400).json({

                    error:
                        "El nombre y el precio son obligatorios"

                });

            }


            const currentProduct =
                await getOne(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `, [id]);


            if (!currentProduct) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            const image =
                req.file
                    ? `/images/${req.file.filename}`
                    : currentProduct.image;


            await execute(`
                UPDATE products

                SET
                    name = ?,
                    description = ?,
                    price = ?,
                    category = ?,
                    image = ?,
                    available = ?

                WHERE id = ?
            `, [

                name,

                description || "",

                price,

                category ||
                    "Platos principales",

                image,

                currentProduct.available,

                id

            ]);


            const updatedProduct =
                await getOne(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `, [id]);


            res.json(updatedProduct);

        } catch (error) {

            console.error(
                "Error editando producto:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo editar el producto"

            });

        }

    }
);


// ========================================
// PUT - CAMBIAR DISPONIBILIDAD
// ========================================

app.put(
    "/api/products/:id/availability",
    requireLogin,
    async (req, res) => {

        try {

            const { id } = req.params;

            const { available } = req.body;


            const result =
                await execute(`
                    UPDATE products
                    SET available = ?
                    WHERE id = ?
                `, [

                    available ? 1 : 0,

                    id

                ]);


            if (Number(result.rowsAffected) === 0) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            res.json({

                message:
                    "Disponibilidad actualizada correctamente"

            });

        } catch (error) {

            console.error(
                "Error cambiando disponibilidad:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo actualizar la disponibilidad"

            });

        }

    }
);


// ========================================
// POST - CREAR PRODUCTO
// ========================================

app.post(
    "/api/products",
    requireLogin,
    upload.single("image"),
    async (req, res) => {

        try {

            const {
                name,
                description,
                price,
                category
            } = req.body;


            const image =
                req.file
                    ? `/images/${req.file.filename}`
                    : "";


            if (!name || !price) {

                return res.status(400).json({

                    error:
                        "El nombre y el precio son obligatorios"

                });

            }


            const result =
                await execute(`
                    INSERT INTO products
                    (
                        name,
                        description,
                        price,
                        image,
                        category
                    )
                    VALUES (?, ?, ?, ?, ?)
                `, [

                    name,

                    description || "",

                    price,

                    image,

                    category ||
                        "Platos principales"

                ]);


            const newProduct =
                await getOne(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `, [
                    Number(result.lastInsertRowid)
                ]);


            res.status(201).json(
                newProduct
            );

        } catch (error) {

            console.error(
                "Error creando producto:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo crear el producto"

            });

        }

    }
);


// ========================================
// POST - CREAR PEDIDO
// ========================================

app.post(
    "/api/orders",
    async (req, res) => {

        try {

            const {
                customerName,
                customerPhone,
                customerAddress,
                items
            } = req.body;


            if (
                !customerName ||
                !customerPhone ||
                !customerAddress ||
                !items ||
                items.length === 0
            ) {

                return res.status(400).json({

                    error:
                        "Todos los datos del pedido son obligatorios"

                });

            }


            let total = 0;

            const orderItems = [];


            for (const item of items) {

                const product =
                    await getOne(`
                        SELECT *
                        FROM products
                        WHERE id = ?
                        AND available = 1
                    `, [item.id]);


                if (!product) {

                    return res.status(400).json({

                        error:
                            "Uno de los productos no está disponible"

                    });

                }


                const quantity =
                    Number(item.quantity);


                if (
                    !Number.isInteger(quantity) ||
                    quantity <= 0
                ) {

                    return res.status(400).json({

                        error:
                            "Cantidad de producto inválida"

                    });

                }


                const subtotal =
                    Number(product.price) *
                    quantity;


                total += subtotal;


                orderItems.push({

                    productId:
                        Number(product.id),

                    productName:
                        product.name,

                    quantity:
                        quantity,

                    price:
                        Number(product.price),

                    subtotal:
                        subtotal

                });

            }


            // ========================================
            // CREAR PEDIDO
            // ========================================

            const orderResult =
                await execute(`
                    INSERT INTO orders
                    (
                        customer_name,
                        customer_phone,
                        customer_address,
                        total
                    )
                    VALUES (?, ?, ?, ?)
                `, [

                    customerName,

                    customerPhone,

                    customerAddress,

                    total

                ]);


            const orderId =
                Number(
                    orderResult.lastInsertRowid
                );


            // ========================================
            // GUARDAR PRODUCTOS DEL PEDIDO
            // ========================================

            for (const item of orderItems) {

                await execute(`
                    INSERT INTO order_items
                    (
                        order_id,
                        product_id,
                        product_name,
                        quantity,
                        price,
                        subtotal
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [

                    orderId,

                    item.productId,

                    item.productName,

                    item.quantity,

                    item.price,

                    item.subtotal

                ]);

            }


            res.status(201).json({

                message:
                    "Pedido registrado correctamente",

                orderId:
                    orderId,

                total:
                    total.toFixed(2)

            });

        } catch (error) {

            console.error(
                "Error creando pedido:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo registrar el pedido"

            });

        }

    }
);


// ========================================
// GET - OBTENER PEDIDOS
// ========================================

app.get(
    "/api/orders",
    requireLogin,
    async (req, res) => {

        try {

            const orders =
                await getAll(`
                    SELECT *
                    FROM orders

                    ORDER BY
                        CASE
                            WHEN status = 'Pendiente'
                                THEN 0

                            WHEN status = 'En preparación'
                                THEN 1

                            WHEN status = 'Listo'
                                THEN 2

                            WHEN status = 'Entregado'
                                THEN 3

                            ELSE 4

                        END,

                        id DESC
                `);


            const ordersWithItems = [];


            for (const order of orders) {

                const items =
                    await getAll(`
                        SELECT *
                        FROM order_items
                        WHERE order_id = ?
                    `, [
                        order.id
                    ]);


                ordersWithItems.push({

                    ...order,

                    items:
                        items

                });

            }


            res.json(
                ordersWithItems
            );

        } catch (error) {

            console.error(
                "Error obteniendo pedidos:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudieron obtener los pedidos"

            });

        }

    }
);


// ========================================
// GET - CONFIGURACIÓN DEL RESTAURANTE
// ========================================

app.get(
    "/api/restaurant-settings",
    async (req, res) => {

        try {

            const settings =
                await getOne(`
                    SELECT *
                    FROM restaurant_settings
                    WHERE id = 1
                `);


            if (!settings) {

                return res.status(404).json({

                    error:
                        "No existe la configuración del restaurante"

                });

            }


            res.json(settings);

        } catch (error) {

            console.error(
                "Error obteniendo configuración:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo obtener la configuración"

            });

        }

    }
);


// ========================================
// PUT - GUARDAR CONFIGURACIÓN
// ========================================

app.put(
    "/api/restaurant-settings",
    requireLogin,
    async (req, res) => {

        try {

            const {

                name,

                main_title,
                main_subtitle,
                description,

                phone,
                whatsapp,
                address,
                hours,

                button_text,
                secondary_button_text,

                menu_subtitle,
                menu_title,
                menu_description,

                about_subtitle,
                about_title,
                about_text,
                about_text2,

                contact_subtitle,
                contact_title,
                contact_text

            } = req.body;


            if (!name || !name.trim()) {

                return res.status(400).json({

                    error:
                        "El nombre del restaurante es obligatorio"

                });

            }


            await execute(`
                UPDATE restaurant_settings

                SET

                    name = ?,

                    main_title = ?,
                    main_subtitle = ?,
                    description = ?,

                    phone = ?,
                    whatsapp = ?,
                    address = ?,
                    hours = ?,

                    button_text = ?,
                    secondary_button_text = ?,

                    menu_subtitle = ?,
                    menu_title = ?,
                    menu_description = ?,

                    about_subtitle = ?,
                    about_title = ?,
                    about_text = ?,
                    about_text2 = ?,

                    contact_subtitle = ?,
                    contact_title = ?,
                    contact_text = ?

                WHERE id = 1
            `, [

                name.trim(),

                main_title || "",
                main_subtitle || "",
                description || "",

                phone || "",
                whatsapp || "",
                address || "",
                hours || "",

                button_text || "",
                secondary_button_text || "",

                menu_subtitle || "",
                menu_title || "",
                menu_description || "",

                about_subtitle || "",
                about_title || "",
                about_text || "",
                about_text2 || "",

                contact_subtitle || "",
                contact_title || "",
                contact_text || ""

            ]);


            const updatedSettings =
                await getOne(`
                    SELECT *
                    FROM restaurant_settings
                    WHERE id = 1
                `);


            res.json({

                message:
                    "Información del restaurante guardada correctamente",

                settings:
                    updatedSettings

            });

        } catch (error) {

            console.error(
                "Error guardando configuración:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo guardar la configuración"

            });

        }

    }
);


// ========================================
// GET - OBTENER CLIENTES
// ========================================

app.get(
    "/api/clients",
    requireLogin,
    async (req, res) => {

        try {

            const clients =
                await getAll(`
                    SELECT

                        customer_name,

                        customer_phone,

                        customer_address,

                        COUNT(*) AS total_orders,

                        SUM(total) AS total_spent

                    FROM orders

                    GROUP BY customer_phone

                    ORDER BY total_orders DESC
                `);


            res.json(clients);

        } catch (error) {

            console.error(
                "Error obteniendo clientes:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudieron obtener los clientes"

            });

        }

    }
);


// ========================================
// GET - DETALLE DE PEDIDO
// ========================================

app.get(
    "/api/orders/:id/items",
    requireLogin,
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const items =
                await getAll(`
                    SELECT *
                    FROM order_items
                    WHERE order_id = ?
                    ORDER BY id ASC
                `, [id]);


            res.json(items);

        } catch (error) {

            console.error(
                "Error obteniendo detalle:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo obtener el detalle del pedido"

            });

        }

    }
);


// ========================================
// PUT - CAMBIAR ESTADO DEL PEDIDO
// ========================================

app.put(
    "/api/orders/:id/status",
    requireLogin,
    async (req, res) => {

        try {

            const { id } =
                req.params;

            const { status } =
                req.body;


            const allowedStatuses = [

                "Pendiente",

                "En preparación",

                "Listo",

                "Entregado"

            ];


            if (!allowedStatuses.includes(status)) {

                return res.status(400).json({

                    error:
                        "Estado de pedido no válido"

                });

            }


            const result =
                await execute(`
                    UPDATE orders
                    SET status = ?
                    WHERE id = ?
                `, [

                    status,

                    id

                ]);


            if (Number(result.rowsAffected) === 0) {

                return res.status(404).json({

                    error:
                        "Pedido no encontrado"

                });

            }


            res.json({

                message:
                    "Estado actualizado correctamente"

            });

        } catch (error) {

            console.error(
                "Error actualizando estado:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo actualizar el estado"

            });

        }

    }
);


// ========================================
// DELETE - ELIMINAR PEDIDO
// ========================================

app.delete(
    "/api/orders/:id",
    requireLogin,
    async (req, res) => {

        try {

            const { id } =
                req.params;


            // Eliminar productos del pedido

            await execute(`
                DELETE FROM order_items
                WHERE order_id = ?
            `, [id]);


            // Eliminar pedido

            const result =
                await execute(`
                    DELETE FROM orders
                    WHERE id = ?
                `, [id]);


            if (Number(result.rowsAffected) === 0) {

                return res.status(404).json({

                    error:
                        "Pedido no encontrado"

                });

            }


            res.json({

                message:
                    "Pedido eliminado correctamente"

            });

        } catch (error) {

            console.error(
                "Error eliminando pedido:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo eliminar el pedido"

            });

        }

    }
);


// ========================================
// DELETE - ELIMINAR PRODUCTO
// ========================================

app.delete(
    "/api/products/:id",
    requireLogin,
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const result =
                await execute(`
                    DELETE FROM products
                    WHERE id = ?
                `, [id]);


            if (Number(result.rowsAffected) === 0) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            res.json({

                message:
                    "Producto eliminado correctamente"

            });

        } catch (error) {

            console.error(
                "Error eliminando producto:",
                error
            );

            res.status(500).json({

                error:
                    "No se pudo eliminar el producto"

            });

        }

    }
);


// ========================================
// INICIAR SERVIDOR
// ========================================

async function startServer() {

    try {

        await initializeDatabase();


        app.listen(
            PORT,
            () => {

                console.log(
                    `Servidor funcionando en http://localhost:${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "No se pudo iniciar el servidor:",
            error
        );

        process.exit(1);

    }

}


startServer();