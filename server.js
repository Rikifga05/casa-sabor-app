const express = require("express");
require("dotenv").config();
const db = require("./database/database");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

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
            Date.now() + "-" + Math.round(Math.random() * 1E9) + "." + extension;

        cb(null, filename);

    }

});

const upload = multer({
    storage: storage
});

const app = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;


// ========================================
// CONFIGURACIÓN
// ========================================

app.use(express.json());

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
// CONFIGURAR SESIONES
// ========================================

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
   cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60
}
}));


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

app.use(
    "/images",
    express.static(
        path.join(__dirname, "data", "images")
    )
);


// ========================================
// CREAR TABLA DE PRODUCTOS
// ========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image TEXT,
        available INTEGER DEFAULT 1
    )
`);

// Agregar categoría a los productos si todavía no existe
try {
    db.exec(`
        ALTER TABLE products
        ADD COLUMN category TEXT DEFAULT 'Platos principales'
    `);
} catch (error) {
    // La columna ya existe, no hacemos nada
}

// ========================================
// CREAR TABLAS DE PEDIDOS
// ========================================

db.exec(`
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

db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    )
`);


// ========================================
// CREAR TABLA DE USUARIOS
// ========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`);

// ========================================
// CREAR TABLA DE CONFIGURACIÓN DEL RESTAURANTE
// ========================================

db.exec(`
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
// AGREGAR COLUMNAS A TABLAS EXISTENTES
// ========================================

const restaurantColumns = [
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN main_title TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN main_subtitle TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN description TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN phone TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN whatsapp TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN address TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN hours TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN button_text TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN secondary_button_text TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN menu_subtitle TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN menu_title TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN menu_description TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN about_subtitle TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN about_title TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN about_text TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN about_text2 TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN contact_subtitle TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN contact_title TEXT DEFAULT ''`
    },
    {
        sql: `ALTER TABLE restaurant_settings ADD COLUMN contact_text TEXT DEFAULT ''`
    }
];


restaurantColumns.forEach(column => {

    try {

        db.exec(column.sql);

    } catch (error) {

        // La columna ya existe.
        // No hacemos nada.

    }

});


// ========================================
// CREAR CONFIGURACIÓN INICIAL
// ========================================

const restaurantSettings =
    db.prepare(`
        SELECT *
        FROM restaurant_settings
        WHERE id = 1
    `).get();


if (!restaurantSettings) {

    db.prepare(`
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
    `).run(

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

    );

}

// ========================================
// CREAR USUARIO ADMINISTRADOR
// ========================================

const userCount = db
    .prepare("SELECT COUNT(*) AS total FROM users")
    .get();

if (userCount.total === 0) {

    const passwordHash = bcrypt.hashSync(
        process.env.ADMIN_PASSWORD,
        10
    );

    db.prepare(`
        INSERT INTO users
        (username, password)
        VALUES (?, ?)
    `).run(
        process.env.ADMIN_USERNAME,
        passwordHash
    );

    console.log("Usuario administrador creado");
}

// ========================================
// CREAR PRODUCTO INICIAL
// ========================================

const productCount = db
    .prepare("SELECT COUNT(*) AS total FROM products")
    .get();

if (productCount.total === 0) {

    db.prepare(`
        INSERT INTO products
        (name, description, price, category)
        VALUES (?, ?, ?, ?)
    `).run(
        "Hamburguesa Casa",
        "Carne Angus, queso cheddar y salsa especial.",
        18.90,
        "Platos principales"
    );

    console.log("Producto inicial creado");
}

// ========================================
// GET - OBTENER PRODUCTOS
// ========================================

// ========================================
// POST - LOGIN
// ========================================

app.post("/api/login", async (req, res) => {

    const {
        username,
        password
    } = req.body;


    // Comprobar que llegaron los datos
    if (!username || !password) {

        return res.status(400).json({
            error: "Usuario y contraseña son obligatorios"
        });

    }


    // Buscar usuario
    const user = db
        .prepare(`
            SELECT *
            FROM users
            WHERE username = ?
        `)
        .get(username);


    // Usuario inexistente
    if (!user) {

        return res.status(401).json({
            error: "Usuario o contraseña incorrectos"
        });

    }


    // Comprobar contraseña
    const passwordCorrect =
        await bcrypt.compare(
            password,
            user.password
        );


    if (!passwordCorrect) {

        return res.status(401).json({
            error: "Usuario o contraseña incorrectos"
        });

    }


    // Guardar usuario en la sesión
req.session.user = {
    id: user.id,
    username: user.username
};


res.json({
    message: "Login correcto",
    username: user.username
});

});

// ========================================
// POST - CERRAR SESIÓN
// ========================================

app.post("/api/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            return res.status(500).json({
                error: "No se pudo cerrar la sesión"
            });

        }

        res.json({
            message: "Sesión cerrada correctamente"
        });

    });

});


// ========================================
// PUT - CAMBIAR CONTRASEÑA DEL USUARIO
// ========================================

app.put("/api/users/change-password", requireLogin, async (req, res) => {

    const {
        currentPassword,
        newPassword
    } = req.body;


    // ========================================
    // VALIDAR DATOS
    // ========================================

    if (!currentPassword || !newPassword) {

        return res.status(400).json({
            error: "La contraseña actual y la nueva contraseña son obligatorias"
        });

    }


    // ========================================
    // VALIDAR LONGITUD
    // ========================================

    if (newPassword.length < 8) {

        return res.status(400).json({
            error: "La nueva contraseña debe tener al menos 8 caracteres"
        });

    }


    // ========================================
    // OBTENER USUARIO DE LA SESIÓN
    // ========================================

    const user = db
        .prepare(`
            SELECT *
            FROM users
            WHERE id = ?
        `)
        .get(req.session.user.id);


    if (!user) {

        return res.status(404).json({
            error: "Usuario no encontrado"
        });

    }


    // ========================================
    // COMPROBAR CONTRASEÑA ACTUAL
    // ========================================

    const passwordCorrect =
        await bcrypt.compare(
            currentPassword,
            user.password
        );


    if (!passwordCorrect) {

        return res.status(401).json({
            error: "La contraseña actual es incorrecta"
        });

    }


    // ========================================
    // GENERAR NUEVO HASH
    // ========================================

    const newPasswordHash =
        await bcrypt.hash(
            newPassword,
            10
        );


    // ========================================
    // ACTUALIZAR CONTRASEÑA
    // ========================================

    db.prepare(`
        UPDATE users
        SET password = ?
        WHERE id = ?
    `).run(
        newPasswordHash,
        user.id
    );


    // ========================================
    // RESPUESTA
    // ========================================

    res.json({
        message: "Contraseña actualizada correctamente"
    });

});

// ========================================
// GET - OBTENER PRODUCTOS
// ========================================

app.get("/api/products", (req, res) => {

    const products = db
        .prepare(`
            SELECT *
            FROM products
            WHERE available = 1
            ORDER BY id DESC
        `)
        .all();

    res.json(products);

});


// ========================================
// GET - OBTENER TODOS LOS PRODUCTOS PARA ADMIN
// ========================================

app.get("/api/admin/products", requireLogin, (req, res) => {

    const products = db
        .prepare(`
            SELECT *
            FROM products
            ORDER BY id DESC
        `)
        .all();

    res.json(products);

});


// ========================================
// PUT - EDITAR PRODUCTO
// ========================================

app.put("/api/products/:id", requireLogin, upload.single("image"), (req, res) => {

    const { id } = req.params;

   const {
    name,
    description,
    price,
    category
} = req.body;

    // Validar datos
    if (!name || !price) {

        return res.status(400).json({
            error: "El nombre y el precio son obligatorios"
        });

    }

    // Obtener producto actual
    const currentProduct = db
        .prepare(`
            SELECT *
            FROM products
            WHERE id = ?
        `)
        .get(id);

    // Comprobar si existe
    if (!currentProduct) {

        return res.status(404).json({
            error: "Producto no encontrado"
        });

    }

    // Mantener la imagen anterior si no se selecciona una nueva
    const image =
        req.file
            ? `/images/${req.file.filename}`
            : currentProduct.image;

    // Actualizar producto
    db
        .prepare(`
            UPDATE products
                SET
                   name = ?,
            description = ?,
            price = ?,
            category = ?,
            image = ?,
            available = ?
            WHERE id = ?
        `)

       .run(
    name,
    description || "",
    price,
    category || "Platos principales",
    image,
    currentProduct.available,
    id
);

    // Obtener producto actualizado
    const updatedProduct = db
        .prepare(`
            SELECT *
            FROM products
            WHERE id = ?
        `)
        .get(id);

    res.json(updatedProduct);

});

// ========================================
// PUT - CAMBIAR DISPONIBILIDAD DEL PRODUCTO
// ========================================

app.put("/api/products/:id/availability", requireLogin, (req, res) => {

    const { id } = req.params;
    const { available } = req.body;

    const result = db
        .prepare(`
            UPDATE products
            SET available = ?
            WHERE id = ?
        `)
        .run(
            available ? 1 : 0,
            id
        );

    if (result.changes === 0) {

        return res.status(404).json({
            error: "Producto no encontrado"
        });

    }

    res.json({
        message: "Disponibilidad actualizada correctamente"
    });

});

// ========================================
// POST - CREAR PRODUCTO
// ========================================

app.post("/api/products", requireLogin, upload.single("image"), (req, res) => {

    const {
    name,
    description,
    price,
    category
} = req.body;

const image =
    req.file ? `/images/${req.file.filename}` : "";


    // Validar datos
    if (!name || !price) {

        return res.status(400).json({
            error: "El nombre y el precio son obligatorios"
        });

    }


    // Guardar producto en SQLite
  const result = db
    .prepare(`
        INSERT INTO products
        (name, description, price, image, category)
        VALUES (?, ?, ?, ?, ?)
    `)
    .run(
        name,
        description || "",
        price,
        image,
        category || "Platos principales"
    );


    // Obtener el producto recién creado
    const newProduct = db
        .prepare(`
            SELECT *
            FROM products
            WHERE id = ?
        `)
        .get(result.lastInsertRowid);


    // Enviar respuesta
    res.status(201).json(newProduct);

});


// ========================================
// POST - CREAR PEDIDO
// ========================================

app.post("/api/orders", (req, res) => {

    const {
        customerName,
        customerPhone,
        customerAddress,
        items
    } = req.body;


    // ========================================
    // VALIDAR DATOS DEL CLIENTE
    // ========================================

    if (
        !customerName ||
        !customerPhone ||
        !customerAddress ||
        !items ||
        items.length === 0
    ) {

        return res.status(400).json({
            error: "Todos los datos del pedido son obligatorios"
        });

    }


    // ========================================
    // CALCULAR TOTAL
    // ========================================

    let total = 0;

    const orderItems = [];


    for (const item of items) {

        const product = db
            .prepare(`
                SELECT *
                FROM products
                WHERE id = ?
                AND available = 1
            `)
            .get(item.id);


        if (!product) {

            return res.status(400).json({
                error: "Uno de los productos no está disponible"
            });

        }


        const quantity = Number(item.quantity);


        if (!Number.isInteger(quantity) || quantity <= 0) {

            return res.status(400).json({
                error: "Cantidad de producto inválida"
            });

        }


        const subtotal =
            Number(product.price) * quantity;


        total += subtotal;


        orderItems.push({

            productId: product.id,

            productName: product.name,

            quantity: quantity,

            price: Number(product.price),

            subtotal: subtotal

        });

    }


    // ========================================
    // GUARDAR PEDIDO
    // ========================================

    const createOrder = db.transaction(() => {

        const orderResult = db
            .prepare(`
                INSERT INTO orders
                (
                    customer_name,
                    customer_phone,
                    customer_address,
                    total
                )
                VALUES (?, ?, ?, ?)
            `)
            .run(
                customerName,
                customerPhone,
                customerAddress,
                total
            );


        const orderId =
            orderResult.lastInsertRowid;


        // ========================================
        // GUARDAR PRODUCTOS DEL PEDIDO
        // ========================================

        const insertItem = db
            .prepare(`
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
            `);


        for (const item of orderItems) {

            insertItem.run(
                orderId,
                item.productId,
                item.productName,
                item.quantity,
                item.price,
                item.subtotal
            );

        }


        return orderId;

    });


    const orderId = createOrder();


    // ========================================
    // RESPUESTA
    // ========================================

    res.status(201).json({

        message: "Pedido registrado correctamente",

        orderId: orderId,

        total: total.toFixed(2)

    });

});

// ========================================
// GET - OBTENER PEDIDOS
// ========================================

app.get("/api/orders", requireLogin, (req, res) => {

    const orders = db
    .prepare(`
        SELECT *
        FROM orders
        ORDER BY
            CASE
                WHEN status = 'Pendiente' THEN 0
                WHEN status = 'En preparación' THEN 1
                WHEN status = 'Listo' THEN 2
                WHEN status = 'Entregado' THEN 3
                ELSE 4
            END,
            id DESC
    `)
    .all();


    // Obtener productos de cada pedido

    const getItems = db.prepare(`
        SELECT *
        FROM order_items
        WHERE order_id = ?
    `);


    const ordersWithItems = orders.map(order => {

        return {
            ...order,
            items: getItems.all(order.id)
        };

    });


    res.json(ordersWithItems);

});


// ========================================
// GET - OBTENER CONFIGURACIÓN DEL RESTAURANTE
// ========================================

app.get("/api/restaurant-settings", (req, res) => {

    const settings = db.prepare(`
        SELECT *
        FROM restaurant_settings
        WHERE id = 1
    `).get();


    if (!settings) {

        return res.status(404).json({
            error: "No existe la configuración del restaurante"
        });

    }


    res.json(settings);

});


// ========================================
// PUT - GUARDAR CONFIGURACIÓN DEL RESTAURANTE
// ========================================

app.put(
    "/api/restaurant-settings",
    requireLogin,
    (req, res) => {

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


        // ========================================
        // VALIDAR NOMBRE
        // ========================================

        if (!name || !name.trim()) {

            return res.status(400).json({
                error:
                    "El nombre del restaurante es obligatorio"
            });

        }


        // ========================================
        // ACTUALIZAR CONFIGURACIÓN
        // ========================================

        db.prepare(`
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
        `).run(

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

        );


        // ========================================
        // OBTENER DATOS ACTUALIZADOS
        // ========================================

        const updatedSettings =
            db.prepare(`
                SELECT *
                FROM restaurant_settings
                WHERE id = 1
            `).get();


        res.json({

            message:
                "Información del restaurante guardada correctamente",

            settings:
                updatedSettings

        });

    }
);




// ========================================
// GET - OBTENER CLIENTES
// ========================================

app.get("/api/clients", requireLogin, (req, res) => {

    const clients = db.prepare(`
        SELECT
            customer_name,
            customer_phone,
            customer_address,
            COUNT(*) AS total_orders,
            SUM(total) AS total_spent
        FROM orders
        GROUP BY customer_phone
        ORDER BY total_orders DESC
    `).all();

    res.json(clients);

});


// ========================================
// GET - OBTENER DETALLE DE UN PEDIDO
// ========================================

app.get("/api/orders/:id/items", requireLogin, (req, res) => {

    const { id } = req.params;

    const items = db
        .prepare(`
            SELECT *
            FROM order_items
            WHERE order_id = ?
            ORDER BY id ASC
        `)
        .all(id);

    res.json(items);

});

// ========================================
// PUT - CAMBIAR ESTADO DEL PEDIDO
// ========================================

app.put("/api/orders/:id/status", requireLogin, (req, res) => {

    const { id } = req.params;
    const { status } = req.body;


    // Estados permitidos

    const allowedStatuses = [
        "Pendiente",
        "En preparación",
        "Listo",
        "Entregado"
    ];


    // Comprobar estado

    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
            error: "Estado de pedido no válido"
        });

    }


    // Actualizar estado

    const result = db
        .prepare(`
            UPDATE orders
            SET status = ?
            WHERE id = ?
        `)
        .run(status, id);


    // Comprobar pedido

    if (result.changes === 0) {

        return res.status(404).json({
            error: "Pedido no encontrado"
        });

    }


    res.json({
        message: "Estado actualizado correctamente"
    });

});

// ========================================
// DELETE - ELIMINAR PEDIDO
// ========================================

app.delete("/api/orders/:id", requireLogin, (req, res) => {

    const { id } = req.params;


    // ========================================
    // ELIMINAR PEDIDO Y SUS PRODUCTOS
    // ========================================

    const deleteOrder = db.transaction(() => {

        // Eliminar productos del pedido

        db.prepare(`
            DELETE FROM order_items
            WHERE order_id = ?
        `).run(id);


        // Eliminar pedido

        const result = db.prepare(`
            DELETE FROM orders
            WHERE id = ?
        `).run(id);


        return result;

    });


    const result = deleteOrder();


    // ========================================
    // COMPROBAR PEDIDO
    // ========================================

    if (result.changes === 0) {

        return res.status(404).json({
            error: "Pedido no encontrado"
        });

    }


    res.json({
        message: "Pedido eliminado correctamente"
    });

});



// ========================================
// DELETE - ELIMINAR PRODUCTO
// ========================================

app.delete("/api/products/:id", requireLogin, (req, res) => {

    const { id } = req.params;

    const result = db
        .prepare(`
            DELETE FROM products
            WHERE id = ?
        `)
        .run(id);

    if (result.changes === 0) {

        return res.status(404).json({
            error: "Producto no encontrado"
        });

    }

    res.json({
        message: "Producto eliminado correctamente"
    });

});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {

    console.log(
        `Servidor funcionando en http://localhost:${PORT}`
    );

});


