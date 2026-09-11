// ========================================
// FORMULARIO PARA CREAR PRODUCTOS
// ========================================

const form = document.getElementById("productForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name =
        document.getElementById("name").value;

    const description =
        document.getElementById("description").value;

    const price =
        document.getElementById("price").value;

    const category =
        document.getElementById("category").value;

    const image =
        document.getElementById("image").files[0];

    const formData = new FormData();

    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", Number(price));
    formData.append("category", category);

    if (image) {
        formData.append("image", image);
    }

    try {

        const response = await fetch("/api/products", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {

            message.textContent =
                `Producto "${data.name}" creado correctamente.`;

            form.reset();

            imagePreview.style.display = "none";
            imagePreview.src = "";

            loadProducts();

        } else {

            message.textContent =
                data.error || "Ha ocurrido un error.";

        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "No se pudo conectar con el servidor.";

    }

});



// ========================================
// PREVISUALIZACIÓN DE IMAGEN
// ========================================

const imageInput =
    document.getElementById("image");

const imagePreview =
    document.getElementById("imagePreview");


imageInput.addEventListener("change", () => {

    const file =
        imageInput.files[0];

    if (!file) {

        imagePreview.style.display = "none";

        return;

    }

    imagePreview.src =
        URL.createObjectURL(file);

    imagePreview.style.display =
        "block";

    imagePreview.onclick = () => {

        const imageModal =
            document.getElementById("imageModal");

        const modalImage =
            document.getElementById("modalImage");

        modalImage.src =
            imagePreview.src;

        imageModal.style.display =
            "flex";

    };

});



// ========================================
// CERRAR MODAL DE IMAGEN
// ========================================

const imageModal =
    document.getElementById("imageModal");

if (imageModal) {

    imageModal.addEventListener("click", (event) => {

        if (event.target === imageModal) {

            imageModal.style.display =
                "none";

        }

    });

}



// ========================================
// FILTRO DE CATEGORÍAS DE PRODUCTOS
// ========================================

let selectedProductCategory =
    "Todos";



// ========================================
// CARGAR PRODUCTOS
// ========================================

async function loadProducts() {

    try {

        const response =
            await fetch("/api/admin/products");

        const products =
            await response.json(); 

        const totalProductsCount =
    document.getElementById(
        "totalProductsCount"
    );

if (totalProductsCount) {

    totalProductsCount.textContent =
        products.length;

}


const unavailableProductsCount =
    document.getElementById(
        "unavailableProductsCount"
    );

if (unavailableProductsCount) {

    unavailableProductsCount.textContent =
        products.filter(
            product => product.available === 0
        ).length;

}

        const productList =
            document.getElementById("productList");

        productList.innerHTML = "";



        // ========================================
        // FILTRAR POR CATEGORÍA
        // ========================================

        const filteredProducts =
            selectedProductCategory === "Todos"

                ? products

                : products.filter(product =>
                    product.category === selectedProductCategory
                );



        // ========================================
        // SI NO HAY PRODUCTOS
        // ========================================

        if (filteredProducts.length === 0) {

            productList.innerHTML = `

                <p class="no-products">
                    No hay productos en esta categoría.
                </p>

            `;

            return;

        }



        // ========================================
        // CREAR CUADRÍCULA
        // ========================================

        const productGrid =
            document.createElement("div");

        productGrid.className =
            "admin-products-grid";



        // ========================================
        // MOSTRAR PRODUCTOS
        // ========================================

        filteredProducts.forEach(product => {

            const productElement =
                document.createElement("div");

            productElement.className =
                "product-card";


            productElement.innerHTML = `

                ${
                    product.image
                        ? `
                            <img
                                src="${product.image}"
                                alt="${product.name}"
                                class="product-image"
                            >
                          `
                        : ""
                }


                <h3>
                    ${product.name}
                </h3>


                <p class="product-category">
                    ${product.category}
                </p>


                <p class="product-price">
                    S/ ${Number(product.price).toFixed(2)}
                </p>


                <p>
                    ${
                        product.description ||
                        "Sin descripción"
                    }
                </p>


                <button
                    class="edit-button"
                    onclick="editProduct(${product.id})"
                >
                    ✏️ Editar
                </button>


                <button
                    class="availability-button"
                    onclick="toggleAvailability(
                        ${product.id},
                        ${product.available}
                    )"
                >
                    ${
                        product.available
                            ? "🟢 Disponible"
                            : "🔴 No disponible"
                    }
                </button>


                <button
                    class="delete-button"
                    onclick="deleteProduct(${product.id})"
                >
                    🗑️ Eliminar
                </button>

            `;


            productGrid.appendChild(
                productElement
            );

        });



        productList.appendChild(
            productGrid
        );


    } catch (error) {

        console.error(
            "Error al cargar productos:",
            error
        );

    }

}



// ========================================
// BOTONES DE FILTRO DE PRODUCTOS
// ========================================

document
    .querySelectorAll(".admin-category-filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".admin-category-filter"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                selectedProductCategory =
                    button.dataset.category;


                loadProducts();

            }
        );

    });



// ========================================
// EDITAR PRODUCTO
// ========================================

async function editProduct(id) {

    try {

        const response =
            await fetch("/api/products");

        const products =
            await response.json();


        const product =
            products.find(item =>
                item.id === id
            );


        if (!product) {

            alert(
                "Producto no encontrado."
            );

            return;

        }



        // ========================================
        // CARGAR DATOS
        // ========================================

        document.getElementById("editName").value =
            product.name;


        document.getElementById("editDescription").value =
            product.description || "";


        document.getElementById("editPrice").value =
            product.price;


        document.getElementById("editCategory").value =
            product.category || "Platos principales";



        // ========================================
        // MOSTRAR IMAGEN ACTUAL
        // ========================================

        const editImagePreview =
            document.getElementById(
                "editImagePreview"
            );


        if (product.image) {

            editImagePreview.src =
                product.image;

            editImagePreview.style.display =
                "block";

        } else {

            editImagePreview.style.display =
                "none";

        }



        // ========================================
        // LIMPIAR NUEVA IMAGEN
        // ========================================

        document.getElementById(
            "editImage"
        ).value = "";



        // ========================================
        // GUARDAR ID
        // ========================================

        const saveEditButton =
            document.getElementById(
                "saveEditButton"
            );


        saveEditButton.dataset.id =
            id;



        // ========================================
        // MOSTRAR MODAL
        // ========================================

        document.getElementById(
            "editModal"
        ).style.display = "flex";


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo cargar el producto."
        );

    }

}



// ========================================
// BOTÓN CANCELAR EDICIÓN
// ========================================

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );


if (cancelEditButton) {

    cancelEditButton.addEventListener(
        "click",
        () => {

            document.getElementById(
                "editModal"
            ).style.display = "none";

        }
    );

}



// ========================================
// BOTÓN GUARDAR EDICIÓN
// ========================================

const saveEditButton =
    document.getElementById(
        "saveEditButton"
    );


if (saveEditButton) {

    saveEditButton.addEventListener(
        "click",
        async () => {

            try {

                const id =
                    saveEditButton.dataset.id;


                // ========================================
                // OBTENER DATOS
                // ========================================

                const name =
                    document.getElementById(
                        "editName"
                    ).value.trim();


                const description =
                    document.getElementById(
                        "editDescription"
                    ).value.trim();


                const price =
                    document.getElementById(
                        "editPrice"
                    ).value;


                const category =
                    document.getElementById(
                        "editCategory"
                    ).value;


                const image =
                    document.getElementById(
                        "editImage"
                    ).files[0];



                // ========================================
                // VALIDAR
                // ========================================

                if (!name || !price) {

                    alert(
                        "El nombre y el precio son obligatorios."
                    );

                    return;

                }


                if (!category) {

                    alert(
                        "Debes seleccionar una categoría."
                    );

                    return;

                }



                // ========================================
                // PREPARAR DATOS
                // ========================================

                const formData =
                    new FormData();


                formData.append(
                    "name",
                    name
                );


                formData.append(
                    "description",
                    description
                );


                formData.append(
                    "price",
                    Number(price)
                );


                formData.append(
                    "category",
                    category
                );



                // ========================================
                // NUEVA IMAGEN
                // ========================================

                if (image) {

                    formData.append(
                        "image",
                        image
                    );

                }



                // ========================================
                // ENVIAR ACTUALIZACIÓN
                // ========================================

                const response =
                    await fetch(
                        `/api/products/${id}`,
                        {
                            method: "PUT",
                            body: formData
                        }
                    );


                const data =
                    await response.json();



                // ========================================
                // RESPUESTA
                // ========================================

                if (response.ok) {

                    alert(
                        "Producto actualizado correctamente."
                    );


                    document.getElementById(
                        "editModal"
                    ).style.display = "none";


                    loadProducts();


                } else {

                    alert(
                        data.error ||
                        "No se pudo actualizar el producto."
                    );

                }


            } catch (error) {

                console.error(error);

                alert(
                    "No se pudo conectar con el servidor."
                );

            }

        }
    );

}



// ========================================
// CARGAR PRODUCTOS AL ABRIR LA PÁGINA
// ========================================

loadProducts();



// ========================================
// ELIMINAR PRODUCTO
// ========================================

async function deleteProduct(id) {

    const confirmDelete =
        confirm(
            "¿Seguro que quieres eliminar este producto?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/products/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "Producto eliminado correctamente."
            );

            loadProducts();

        } else {

            alert(
                data.error ||
                "No se pudo eliminar el producto."
            );

        }

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo conectar con el servidor."
        );

    }

}



// ========================================
// CERRAR SESIÓN
// ========================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                const response =
                    await fetch(
                        "/api/logout",
            
                        {
                            method: "POST"
                        }
                    );


                if (response.ok) {

                    window.location.href =
                        "/login.html";

                } else {

                    alert(
                        "No se pudo cerrar la sesión."
                    );

                }

            } catch (error) {

                console.error(error);

                alert(
                    "No se pudo conectar con el servidor."
                );

            }

        }
    );

}



// ========================================
// FILTRO DE PEDIDOS
// ========================================

let selectedOrderStatus =
    "Todos";



// ========================================
// CARGAR PEDIDOS
// ========================================

async function loadOrders() {

    try {

        const response =
            await fetch("/api/orders");


        if (!response.ok) {

            console.error(
                "No se pudieron cargar los pedidos."
            );

            return;

        }


        const orders =
            await response.json();



        // ========================================
        // CONTADORES
        // ========================================

        const pendingOrdersCount =
            document.getElementById(
                "pendingOrdersCount"
            );


        const pendingCount =
            orders.filter(
                order =>
                    order.status === "Pendiente"
            ).length;


        if (pendingOrdersCount) {

            pendingOrdersCount.textContent =
                pendingCount;

        }


        const totalOrdersCount =
            document.getElementById(
                "totalOrdersCount"
            );


        const pendingSummaryCount =
            document.getElementById(
                "pendingSummaryCount"
            );


        const readyOrdersCount =
            document.getElementById(
                "readyOrdersCount"
            );


        const deliveredOrdersCount =
            document.getElementById(
                "deliveredOrdersCount"
            );

        
            const totalSalesAmount =
    document.getElementById(
        "totalSalesAmount"
    );


        if (totalOrdersCount) {

            totalOrdersCount.textContent =
                orders.length;

        }


        if (pendingSummaryCount) {

            pendingSummaryCount.textContent =
                orders.filter(
                    order =>
                        order.status === "Pendiente"
                ).length;

        }


        if (readyOrdersCount) {

            readyOrdersCount.textContent =
                orders.filter(
                    order =>
                        order.status === "Listo"
                ).length;

        }


        if (deliveredOrdersCount) {

            deliveredOrdersCount.textContent =
                orders.filter(
                    order =>
                        order.status === "Entregado"
                ).length;

        }

        if (totalSalesAmount) {

    const totalSales =
        orders.reduce(
            (sum, order) =>
                sum + Number(order.total),
            0
        );

    totalSalesAmount.textContent =
        `S/ ${totalSales.toFixed(2)}`;

}



        // ========================================
        // LISTA DE PEDIDOS
        // ========================================

        const orderList =
            document.getElementById(
                "orderList"
            );


        orderList.innerHTML = "";


        if (orders.length === 0) {

            orderList.innerHTML = `

                <p>
                    No hay pedidos registrados.
                </p>

            `;

            return;

        }



        // ========================================
        // BUSCADOR
        // ========================================

        const orderSearch =
            document.getElementById(
                "orderSearch"
            );


        const searchText =
            orderSearch
                ? orderSearch.value
                    .toLowerCase()
                    .trim()
                : "";



        // ========================================
        // FILTRAR PEDIDOS
        // ========================================

        const filteredOrders =
            orders.filter(order => {

                const matchesStatus =
                    selectedOrderStatus === "Todos" ||
                    order.status === selectedOrderStatus;


                const matchesSearch =
                    String(order.id)
                        .includes(searchText) ||

                    String(order.customer_name || "")
                        .toLowerCase()
                        .includes(searchText) ||

                    String(order.customer_phone || "")
                        .toLowerCase()
                        .includes(searchText);


                return (
                    matchesStatus &&
                    matchesSearch
                );

            });



        // ========================================
        // MOSTRAR PEDIDOS
        // ========================================

        if (filteredOrders.length === 0) {

            orderList.innerHTML = `

                <p>
                    No se encontraron pedidos.
                </p>

            `;

            return;

        }


        filteredOrders.forEach(order => {

            const orderElement =
                document.createElement(
                    "div"
                );


            const statusClass =
                order.status
                    .toLowerCase()
                    .replace(/ /g, "-")
                    .replace(/ó/g, "o");


            orderElement.className =
                `order-card status-${statusClass}`;


            orderElement.innerHTML = `

                <h3>
                    Pedido #${order.id}
                </h3>


                <div
                    class="order-status-badge status-${statusClass}"
                >

                    ${
                        order.status === "Pendiente"
                            ? "🟡 Pendiente"

                            : order.status === "En preparación"
                            ? "🟠 En preparación"

                            : order.status === "Listo"
                            ? "🟢 Listo"

                            : "🔵 Entregado"
                    }

                </div>


                <p>
                    <strong>Cliente:</strong>
                    ${order.customer_name}
                </p>


                <p>
                    <strong>Teléfono:</strong>
                    ${order.customer_phone}
                </p>


                <p>
                    <strong>Dirección:</strong>
                    ${order.customer_address}
                </p>


                <p>
                    <strong>Total:</strong>
                    S/ ${Number(order.total).toFixed(2)}
                </p>


                <div class="order-status">

                    <strong>Estado:</strong>


                    <select
                        onchange="changeOrderStatus(
                            ${order.id},
                            this.value
                        )"
                    >

                        <option
                            value="Pendiente"
                            ${
                                order.status === "Pendiente"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟡 Pendiente
                        </option>


                        <option
                            value="En preparación"
                            ${
                                order.status === "En preparación"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟠 En preparación
                        </option>


                        <option
                            value="Listo"
                            ${
                                order.status === "Listo"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🟢 Listo
                        </option>


                        <option
                            value="Entregado"
                            ${
                                order.status === "Entregado"
                                    ? "selected"
                                    : ""
                            }
                        >
                            🔵 Entregado
                        </option>

                    </select>

                </div>


                <div class="order-items">

                    <h4>
                        Productos del pedido
                    </h4>


                    ${
                        order.items.map(item => `

                            <div class="order-item">

                                <div class="order-item-info">

                                    <strong>
                                        ${item.product_name}
                                    </strong>

                                    <span>
                                        ${item.quantity} ×
                                        S/ ${Number(item.price).toFixed(2)}
                                    </span>

                                </div>


                                <strong>
                                    S/ ${Number(item.subtotal).toFixed(2)}
                                </strong>

                            </div>

                        `).join("")
                    }

                </div>


                <p>

                    <strong>Fecha:</strong>

                    ${
                        new Date(
                            order.created_at
                        ).toLocaleString("es-PE")
                    }

                </p>


                <button
                    class="delete-order-button"
                    onclick="deleteOrder(${order.id})"
                >
                    🗑️ Eliminar pedido
                </button>

            `;


            orderList.appendChild(
                orderElement
            );

        });


    } catch (error) {

        console.error(
            "Error al cargar pedidos:",
            error
        );

    }

}



// ========================================
// CARGAR PEDIDOS AL ABRIR EL PANEL
// ========================================

loadOrders();



// ========================================
// ACTUALIZAR PEDIDOS AUTOMÁTICAMENTE
// ========================================

setInterval(() => {

    loadOrders();

}, 10000);



// ========================================
// FILTROS DE PEDIDOS
// ========================================

document
    .querySelectorAll(".order-filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".order-filter")
                    .forEach(btn =>
                        btn.classList.remove(
                            "active"
                        )
                    );


                button.classList.add(
                    "active"
                );


                selectedOrderStatus =
                    button.dataset.status;


                loadOrders();

            }
        );

    });



// ========================================
// BUSCADOR DE PEDIDOS
// ========================================

const orderSearch =
    document.getElementById(
        "orderSearch"
    );


if (orderSearch) {

    orderSearch.addEventListener(
        "input",
        () => {

            loadOrders();

        }
    );

}



// ========================================
// CAMBIAR ESTADO DEL PEDIDO
// ========================================

async function changeOrderStatus(
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `/api/orders/${orderId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: status
                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "No se pudo actualizar el estado."
            );

            return;

        }


        console.log(
            "Estado actualizado correctamente."
        );


        loadOrders();


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo conectar con el servidor."
        );

    }

}



// ========================================
// ELIMINAR PEDIDO
// ========================================

async function deleteOrder(id) {

    const confirmDelete =
        confirm(
            "¿Seguro que quieres eliminar este pedido?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/orders/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "No se pudo eliminar el pedido."
            );

            return;

        }


        alert(
            "Pedido eliminado correctamente."
        );


        loadOrders();


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo conectar con el servidor."
        );

    }

}



// ========================================
// CAMBIAR DISPONIBILIDAD DEL PRODUCTO
// ========================================

async function toggleAvailability(
    id,
    currentAvailability
) {

    const newAvailability =
        currentAvailability ? false : true;


    try {

        const response =
            await fetch(
                `/api/products/${id}/availability`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        available: newAvailability
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "No se pudo cambiar la disponibilidad."
            );

            return;

        }


        loadProducts();


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo conectar con el servidor."
        );

    }

}

// ========================================
// CARGAR CLIENTES
// ========================================

async function loadClients() {

    try {

        const response =
            await fetch("/api/clients");

        if (!response.ok) {

            console.error(
                "No se pudieron cargar los clientes."
            );

            return;

        }

        const clients =
            await response.json();
        
        window.clientsData = clients;

        const clientList =
            document.getElementById("clientList");

        if (!clientList) {
            return;
        }

        clientList.innerHTML = "";

        // ========================================
        // SI NO HAY CLIENTES
        // ========================================

        if (clients.length === 0) {

            clientList.innerHTML = `
                <p class="no-clients">
                    No hay clientes registrados.
                </p>
            `;

            return;
        }

        // ========================================
        // MOSTRAR CLIENTES
        // ========================================

        clients.forEach(client => {

            const clientElement =
                document.createElement("div");

            clientElement.className =
                "client-card";

            clientElement.innerHTML = `

                <h3>
                    👤 ${client.customer_name}
                </h3>

                <p>
                    <strong>📞 Teléfono:</strong>
                    ${client.customer_phone}
                </p>

                <p>
                    <strong>📍 Dirección:</strong>
                    ${client.customer_address}
                </p>

                <p>
                    <strong>🛒 Pedidos:</strong>
                    ${client.total_orders}
                </p>

                <p>
                    <strong>💰 Total gastado:</strong>
                    S/ ${Number(
                        client.total_spent || 0
                    ).toFixed(2)}
                </p>

            `;

            clientList.appendChild(
                clientElement
            );

        });

    } catch (error) {

        console.error(
            "Error al cargar clientes:",
            error
        );

    }

}


// ========================================
// CARGAR CLIENTES AL ABRIR EL PANEL
// ========================================

loadClients();


// ========================================
// ACTUALIZAR CLIENTES AL ENTRAR
// ========================================

const clientsButton =
    document.querySelector(
        'a[href="#clientes"]'
    );

if (clientsButton) {

    clientsButton.addEventListener(
        "click",
        () => {

            loadClients();

        }
    );

}


// ========================================
// CAMBIAR CONTRASEÑA
// ========================================

const changePasswordForm =
    document.getElementById("changePasswordForm");

if (changePasswordForm) {

    changePasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const currentPassword =
                document.getElementById(
                    "currentPassword"
                ).value;


            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const passwordMessage =
                document.getElementById(
                    "passwordMessage"
                );


            // ========================================
            // COMPROBAR CONTRASEÑAS
            // ========================================

            if (newPassword !== confirmPassword) {

                passwordMessage.textContent =
                    "Las nuevas contraseñas no coinciden.";

                return;

            }


            // ========================================
            // LONGITUD MÍNIMA
            // ========================================

            if (newPassword.length < 8) {

                passwordMessage.textContent =
                    "La nueva contraseña debe tener al menos 8 caracteres.";

                return;

            }


            try {

                const response =
                    await fetch(
                        "/api/users/change-password",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                currentPassword:
                                    currentPassword,

                                newPassword:
                                    newPassword

                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    passwordMessage.textContent =
                        data.error ||
                        "No se pudo cambiar la contraseña.";

                    return;

                }


                // ========================================
                // CAMBIO CORRECTO
                // ========================================

                passwordMessage.textContent =
                    "Contraseña cambiada correctamente.";

                changePasswordForm.reset();


            } catch (error) {

                console.error(error);

                passwordMessage.textContent =
                    "No se pudo conectar con el servidor.";

            }

        }
    );

}


// ========================================
// BUSCADOR DE CLIENTES
// ========================================

const clientSearch =
    document.getElementById("clientSearch");

if (clientSearch) {

    clientSearch.addEventListener("input", () => {

        const searchText =
            clientSearch.value.toLowerCase().trim();

        const clientCards =
            document.querySelectorAll(".client-card");

        clientCards.forEach(card => {

            const cardText =
                card.textContent.toLowerCase();

            if (cardText.includes(searchText)) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

    });

}


// ========================================
// NAVEGACIÓN ENTRE VISTAS
// ========================================

function showAdminView(viewId) {

    const adminViews =
        document.querySelectorAll(".admin-view");

    adminViews.forEach(view => {

        view.style.display = "none";

    });


    const selectedView =
        document.getElementById(viewId);

    if (selectedView) {

        selectedView.style.display = "block";

    }

}


// ========================================
// PEDIDOS
// ========================================

const ordersButton =
    document.querySelector('a[href="#pedidos"]');

if (ordersButton) {

    ordersButton.addEventListener("click", (event) => {

        event.preventDefault();

        showAdminView("pedidos");

    });

}


// ========================================
// PRODUCTOS
// ========================================

const productsButton =
    document.querySelector('a[href="#productos"]');

if (productsButton) {

    productsButton.addEventListener("click", (event) => {

        event.preventDefault();

        showAdminView("productos");

    });

}


// ========================================
// CONFIGURACIÓN
// ========================================

const configurationButton =
    document.getElementById("settingsButton");

if (configurationButton) {

    configurationButton.addEventListener("click", () => {

        showAdminView("configuracion");

    });

}


// ========================================
// CLIENTES
// ========================================

const configurationClientsButton =
    document.querySelector(
        '.configuration-option[href="#clientes"]'
    );

if (configurationClientsButton) {

    configurationClientsButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            showAdminView("clientes");

            loadClients();

        }
    );

}


// ========================================
// CUENTA
// ========================================

const configurationAccountButton =
    document.querySelector(
        '.configuration-option[href="#cuenta"]'
    );

if (configurationAccountButton) {

    configurationAccountButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            showAdminView("cuenta");

        }
    );

}


// ========================================
// RESTAURANTE
// ========================================

const restaurantButton =
    document.querySelector(
        '.configuration-option[href="#restaurante"]'
    );

if (restaurantButton) {

    restaurantButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            showAdminView("restaurante");

            loadRestaurantSettings();

        }
    );

}


// ========================================
// VISTA INICIAL
// ========================================

showAdminView("pedidos");


// ========================================
// CONFIGURACIÓN DEL RESTAURANTE
// ========================================

// ========================================
// CARGAR CONFIGURACIÓN
// ========================================

async function loadRestaurantSettings() {

    try {

        const response =
            await fetch("/api/restaurant-settings");

        if (!response.ok) {

            console.error(
                "No se pudo cargar la configuración."
            );

            return;

        }

        const settings =
            await response.json();


        // ========================================
        // INICIO
        // ========================================

        document.getElementById("restaurantName").value =
            settings.name || "";

        document.getElementById("restaurantHeroSubtitle").value =
            settings.main_subtitle || "";

        document.getElementById("restaurantHeroTitle").value =
            settings.main_title || "";

        document.getElementById("restaurantHeroDescription").value =
            settings.description || "";

        document.getElementById("restaurantHeroPrimaryButton").value =
            settings.button_text || "";

        document.getElementById("restaurantHeroSecondaryButton").value =
            settings.secondary_button_text || "";


        // ========================================
        // MENÚ
        // ========================================

        document.getElementById("restaurantMenuSubtitle").value =
            settings.menu_subtitle || "";

        document.getElementById("restaurantMenuTitle").value =
            settings.menu_title || "";

        document.getElementById("restaurantMenuDescription").value =
            settings.menu_description || "";


        // ========================================
        // NOSOTROS
        // ========================================

        document.getElementById("restaurantAboutSubtitle").value =
            settings.about_subtitle || "";

        document.getElementById("restaurantAboutTitle").value =
            settings.about_title || "";

        document.getElementById("restaurantAboutText").value =
            settings.about_text || "";

        document.getElementById("restaurantAboutText2").value =
            settings.about_text2 || "";


        // ========================================
        // CONTACTO
        // ========================================

        document.getElementById("restaurantContactSubtitle").value =
            settings.contact_subtitle || "";

        document.getElementById("restaurantContactTitle").value =
            settings.contact_title || "";

        document.getElementById("restaurantPhone").value =
            settings.phone || "";

        document.getElementById("restaurantWhatsapp").value =
            settings.whatsapp || "";

        document.getElementById("restaurantAddress").value =
            settings.address || "";

        document.getElementById("restaurantHours").value =
            settings.hours || "";


    } catch (error) {

        console.error(
            "Error al cargar configuración:",
            error
        );

    }

}


// ========================================
// FUNCIÓN PARA GUARDAR UNA SECCIÓN
// ========================================

async function saveRestaurantSection(
    fields,
    messageId
) {

    const message =
        document.getElementById(messageId);


    try {

        // Obtener configuración actual
        const response =
            await fetch("/api/restaurant-settings");


        if (!response.ok) {

            message.textContent =
                "No se pudo obtener la configuración actual.";

            return;

        }


        const currentSettings =
            await response.json();


        // Copiar configuración actual
        const newSettings = {
            ...currentSettings
        };


        // ========================================
        // RELACIÓN ID HTML → COLUMNA SQLITE
        // ========================================

        const fieldMap = {

            restaurantName:
                "name",

            restaurantHeroSubtitle:
                "main_subtitle",

            restaurantHeroTitle:
                "main_title",

            restaurantHeroDescription:
                "description",

            restaurantHeroPrimaryButton:
                "button_text",

            restaurantHeroSecondaryButton:
                "secondary_button_text",


            restaurantMenuSubtitle:
                "menu_subtitle",

            restaurantMenuTitle:
                "menu_title",

            restaurantMenuDescription:
                "menu_description",


            restaurantAboutSubtitle:
                "about_subtitle",

            restaurantAboutTitle:
                "about_title",

            restaurantAboutText:
                "about_text",

            restaurantAboutText2:
                "about_text2",


            restaurantContactSubtitle:
                "contact_subtitle",

            restaurantContactTitle:
                "contact_title",

            restaurantPhone:
                "phone",

            restaurantWhatsapp:
                "whatsapp",

            restaurantAddress:
                "address",

            restaurantHours:
                "hours"

        };


        // ========================================
        // ACTUALIZAR SOLO ESTA SECCIÓN
        // ========================================

        fields.forEach(field => {

            const element =
                document.getElementById(field);

            const databaseField =
                fieldMap[field];


            if (
                element &&
                databaseField
            ) {

                newSettings[databaseField] =
                    element.value.trim();

            }

        });


        // ========================================
        // VALIDAR NOMBRE
        // ========================================

        if (
            fields.includes("restaurantName") &&
            !newSettings.name
        ) {

            message.textContent =
                "El nombre del restaurante es obligatorio.";

            return;

        }


        // ========================================
        // GUARDAR EN EL SERVIDOR
        // ========================================

        const saveResponse =
            await fetch(
                "/api/restaurant-settings",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(newSettings)

                }
            );


        const data =
            await saveResponse.json();


        if (!saveResponse.ok) {

            message.textContent =
                data.error ||
                "No se pudieron guardar los cambios.";

            return;

        }


        message.textContent =
            "✅ Cambios guardados correctamente.";


    } catch (error) {

        console.error(
            "Error al guardar configuración:",
            error
        );

        message.textContent =
            "No se pudo conectar con el servidor.";

    }

}


// ========================================
// GUARDAR INICIO
// ========================================

const saveHomeButton =
    document.getElementById("saveHomeButton");

if (saveHomeButton) {

    saveHomeButton.addEventListener(
        "click",
        () => {

            saveRestaurantSection(
                [
                    "restaurantName",
                    "restaurantHeroSubtitle",
                    "restaurantHeroTitle",
                    "restaurantHeroDescription",
                    "restaurantHeroPrimaryButton",
                    "restaurantHeroSecondaryButton"
                ],
                "homeMessage"
            );

        }
    );

}


// ========================================
// GUARDAR MENÚ
// ========================================

const saveMenuButton =
    document.getElementById("saveMenuButton");

if (saveMenuButton) {

    saveMenuButton.addEventListener(
        "click",
        () => {

            saveRestaurantSection(
                [
                    "restaurantMenuSubtitle",
                    "restaurantMenuTitle",
                    "restaurantMenuDescription"
                ],
                "menuMessage"
            );

        }
    );

}


// ========================================
// GUARDAR NOSOTROS
// ========================================

const saveAboutButton =
    document.getElementById("saveAboutButton");

if (saveAboutButton) {

    saveAboutButton.addEventListener(
        "click",
        () => {

            saveRestaurantSection(
                [
                    "restaurantAboutSubtitle",
                    "restaurantAboutTitle",
                    "restaurantAboutText",
                    "restaurantAboutText2"
                ],
                "aboutMessage"
            );

        }
    );

}


// ========================================
// GUARDAR CONTACTO
// ========================================

const saveContactButton =
    document.getElementById("saveContactButton");

if (saveContactButton) {

    saveContactButton.addEventListener(
        "click",
        () => {

            saveRestaurantSection(
                [
                    "restaurantContactSubtitle",
                    "restaurantContactTitle",
                    "restaurantPhone",
                    "restaurantWhatsapp",
                    "restaurantAddress",
                    "restaurantHours"
                ],
                "contactMessage"
            );

        }
    );

}