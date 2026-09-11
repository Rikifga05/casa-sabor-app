let cart = [];
let selectedCategory = "Todos";


// ========================================
// ELEMENTOS DEL CARRITO
// ========================================

const cartButton = document.getElementById("cartButton");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");


// ========================================
// ABRIR CARRITO
// ========================================

cartButton.addEventListener("click", () => {

    renderCart();

    cartModal.classList.add("show");

});


// ========================================
// CERRAR CARRITO
// ========================================

closeCart.addEventListener("click", () => {

    cartModal.classList.remove("show");

});


// ========================================
// AGREGAR PRODUCTO AL CARRITO
// ========================================

function addToCart(id) {

    const product = window.products.find(
        product => product.id === id
    );

    if (!product) {
        return;
    }

    const existingProduct = cart.find(
        item => item.id === id
    );

    if (existingProduct) {

        existingProduct.quantity++;

    } else {

        cart.push({
            ...product,
            quantity: 1
        });

    }

    renderCart();

}

// ========================================
// MOSTRAR CARRITO
// ========================================

function renderCart() {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        cartItems.innerHTML = "<p>Tu pedido está vacío.</p>";

        cartTotal.textContent = "0.00";

        return;
    }

    let total = 0;

    cart.forEach((product, index) => {

        const subtotal =
            Number(product.price) * product.quantity;

        total += subtotal;

        const item = document.createElement("div");

        item.className = "cart-item";

        item.innerHTML = `

            <div>
                <strong>${product.name}</strong>

                <p>
                    S/ ${Number(product.price).toFixed(2)}
                </p>

                <div class="cart-quantity">

                    <button onclick="decreaseQuantity(${index})">
                        −
                    </button>

                    <span>${product.quantity}</span>

                    <button onclick="increaseQuantity(${index})">
                        +
                    </button>

                </div>

                <p>
                    Subtotal: S/ ${subtotal.toFixed(2)}
                </p>

            </div>

            <button onclick="removeFromCart(${index})">
                🗑️
            </button>

        `;

        cartItems.appendChild(item);

    });

    cartTotal.textContent = total.toFixed(2);

}

// ========================================
// ELIMINAR PRODUCTO DEL CARRITO
// ========================================

function removeFromCart(index) {

    cart.splice(index, 1);

    renderCart();

}

function increaseQuantity(index) {

    cart[index].quantity++;

    renderCart();

}


function decreaseQuantity(index) {

    if (cart[index].quantity > 1) {

        cart[index].quantity--;

    } else {

        cart.splice(index, 1);

    }

    renderCart();

}

// ========================================
// CARGAR PRODUCTOS
// ========================================

async function loadProducts() {

    const response = await fetch("/api/products");

    const products = await response.json();

    window.products = products;

    const container = document.getElementById("products");

    container.innerHTML = "";


    // ========================================
    // FILTRAR POR CATEGORÍA
    // ========================================

    const filteredProducts =
        selectedCategory === "Todos"
            ? products
            : products.filter(product =>
                product.category === selectedCategory
            );


    // ========================================
    // MOSTRAR PRODUCTOS
    // ========================================

    filteredProducts.forEach(product => {

        const productElement = document.createElement("div");

        productElement.className = "product-card";

        productElement.innerHTML = `

            ${product.image ? `
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    class="product-image"
                >
            ` : ""}

            <h3>${product.name}</h3>

            <p>
                ${product.description || "Sin descripción"}
            </p>

            <p class="product-price">
                S/ ${Number(product.price).toFixed(2)}
            </p>

            <button
                class="add-to-cart-button"
                onclick="addToCart(${product.id})"
            >
                🛒 Agregar al pedido
            </button>

        `;

        container.appendChild(productElement);

    });

}


// ========================================
// CARGAR PRODUCTOS AL INICIAR
// ========================================

loadProducts();


// ========================================
// BOTONES DE CATEGORÍAS
// ========================================

const categoryButtons =
    document.querySelectorAll(".category-button");

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        selectedCategory =
            button.dataset.category;

        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

        loadProducts();

    });

});

// ========================================
// MOSTRAR FORMULARIO DEL PEDIDO
// ========================================

const checkoutButton =
    document.getElementById("checkoutButton");

const checkoutForm =
    document.getElementById("checkoutForm");

checkoutForm.style.display = "none";

checkoutButton.addEventListener("click", () => {

    if (cart.length === 0) {

        alert("Tu pedido está vacío.");

        return;
    }

    checkoutForm.style.display = "block";

});

// ========================================
// ENVIAR PEDIDO
// ========================================

const sendOrderButton =
    document.getElementById("sendOrderButton");

sendOrderButton.addEventListener("click", async () => {

    const name =
        document.getElementById("customerName").value.trim();

    const phone =
        document.getElementById("customerPhone").value.trim();

    const address =
        document.getElementById("customerAddress").value.trim();


    // ========================================
    // VALIDAR DATOS
    // ========================================

    if (!name || !phone || !address) {

        alert("Por favor, completa todos los datos.");

        return;

    }


    if (cart.length === 0) {

        alert("Tu pedido está vacío.");

        return;

    }


    // ========================================
    // PREPARAR PEDIDO
    // ========================================

    const items = cart.map(product => ({

        id: product.id,

        quantity: product.quantity

    }));


    try {

        const response = await fetch("/api/orders", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                customerName: name,

                customerPhone: phone,

                customerAddress: address,

                items: items

            })

        });


        const data = await response.json();


        // ========================================
        // COMPROBAR RESPUESTA
        // ========================================

        if (!response.ok) {

            alert(
                data.error ||
                "No se pudo registrar el pedido."
            );

            return;

        }


        // ========================================
        // PEDIDO REGISTRADO
        // ========================================

        alert(
            "¡Pedido registrado correctamente!\n\n" +
            "Número de pedido: #" + data.orderId + "\n" +
            "Total: S/ " + data.total
        );


        // Vaciar carrito

        cart = [];

        renderCart();


        // Limpiar formulario

        document.getElementById("customerName").value = "";

        document.getElementById("customerPhone").value = "";

        document.getElementById("customerAddress").value = "";


        // Ocultar formulario

        checkoutForm.style.display = "none";


    } catch (error) {

        console.error(error);

        alert(
            "No se pudo conectar con el servidor."
        );

    }

});


// ========================================
// CARGAR CONFIGURACIÓN DEL RESTAURANTE
// ========================================

async function loadPublicRestaurantSettings() {

    try {

        const response =
            await fetch("/api/restaurant-settings");

        if (!response.ok) {
            return;
        }

        const settings =
            await response.json();


        // Nombre
        const restaurantName =
            document.getElementById("publicRestaurantName");

        if (restaurantName) {
            restaurantName.textContent =
                settings.name || "Casa Sabor";
        }


        // Frase superior
        const heroSubtitle =
            document.getElementById("publicHeroSubtitle");

        if (heroSubtitle) {
            heroSubtitle.textContent =
                settings.main_subtitle || "";
        }


        // Título principal
        const heroTitle =
            document.getElementById("publicHeroTitle");

        if (heroTitle) {
            heroTitle.innerHTML =
                (settings.main_title || "")
                    .replace(/\n/g, "<br>");
        }


        // Descripción
        const heroDescription =
            document.getElementById("publicHeroDescription");

        if (heroDescription) {
            heroDescription.textContent =
                settings.description || "";
        }


        // Botón principal
        const primaryButton =
            document.getElementById(
                "publicHeroPrimaryButton"
            );

        if (primaryButton) {
            primaryButton.textContent =
                settings.button_text || "";
        }


        // Segundo botón
        const secondaryButton =
            document.getElementById(
                "publicHeroSecondaryButton"
            );

        if (secondaryButton) {
            secondaryButton.textContent =
                settings.secondary_button_text || "";
        }

    } catch (error) {

        console.error(
            "Error al cargar configuración pública:",
            error
        );

    }

}


// ========================================
// CARGAR AL ABRIR LA PÁGINA
// ========================================

loadPublicRestaurantSettings();

// ========================================
// ACTUALIZAR MENÚ, NOSOTROS Y CONTACTO
// ========================================

async function loadPublicRestaurantContent() {

    try {

        const response =
            await fetch("/api/restaurant-settings");

        if (!response.ok) {
            return;
        }

        const settings =
            await response.json();


        // ========================================
        // MENÚ
        // ========================================

        const menuSubtitle =
            document.getElementById("publicMenuSubtitle");

        if (menuSubtitle) {
            menuSubtitle.textContent =
                settings.menu_subtitle || "";
        }


        const menuTitle =
            document.getElementById("publicMenuTitle");

        if (menuTitle) {
            menuTitle.textContent =
                settings.menu_title || "";
        }


        const menuDescription =
            document.getElementById(
                "publicMenuDescription"
            );

        if (menuDescription) {
            menuDescription.textContent =
                settings.menu_description || "";
        }


        // ========================================
        // NOSOTROS
        // ========================================

        const aboutSubtitle =
            document.getElementById(
                "publicAboutSubtitle"
            );

        if (aboutSubtitle) {
            aboutSubtitle.textContent =
                settings.about_subtitle || "";
        }


        const aboutTitle =
            document.getElementById(
                "publicAboutTitle"
            );

        if (aboutTitle) {
            aboutTitle.textContent =
                settings.about_title || "";
        }


        const aboutText =
            document.getElementById(
                "publicAboutText"
            );

        if (aboutText) {
            aboutText.textContent =
                settings.about_text || "";
        }


        const aboutText2 =
            document.getElementById(
                "publicAboutText2"
            );

        if (aboutText2) {
            aboutText2.textContent =
                settings.about_text2 || "";
        }


        // ========================================
        // CONTACTO
        // ========================================

        const contactSubtitle =
            document.getElementById(
                "publicContactSubtitle"
            );

        if (contactSubtitle) {
            contactSubtitle.textContent =
                settings.contact_subtitle || "";
        }


        const contactTitle =
            document.getElementById(
                "publicContactTitle"
            );

        if (contactTitle) {
            contactTitle.textContent =
                settings.contact_title || "";
        }


        const restaurantPhone =
            document.getElementById(
                "publicRestaurantPhone"
            );

        if (restaurantPhone) {
            restaurantPhone.textContent =
                settings.phone || "Número de contacto";
        }
        

     const restaurantWhatsapp =
    document.getElementById(
        "publicRestaurantWhatsapp"
    );

if (restaurantWhatsapp) {

    const whatsappNumber =
        String(settings.whatsapp || "")
            .replace(/\D/g, "");

    if (whatsappNumber) {

        restaurantWhatsapp.textContent =
            settings.whatsapp;

        restaurantWhatsapp.href =
            `https://wa.me/51${whatsappNumber}`;

    } else {

        restaurantWhatsapp.textContent =
            "WhatsApp";

        restaurantWhatsapp.removeAttribute("href");

    }

}

        const restaurantAddress =
            document.getElementById(
                "publicRestaurantAddress"
            );

        if (restaurantAddress) {
            restaurantAddress.textContent =
                settings.address || "Dirección de Casa Sabor";
        }


        const restaurantHours =
            document.getElementById(
                "publicRestaurantHours"
            );

        if (restaurantHours) {
            restaurantHours.textContent =
                settings.hours || "Horario de atención";
        }

    } catch (error) {

        console.error(
            "Error al cargar contenido público:",
            error
        );

    }

}


// ========================================
// CARGAR CONTENIDO PÚBLICO
// ========================================

loadPublicRestaurantContent();