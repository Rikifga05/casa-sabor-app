const loginForm = document.getElementById("loginForm");

const message = document.getElementById("message");


loginForm.addEventListener("submit", async (event) => {

    // Evitar que la página se recargue
    event.preventDefault();


    // Obtener datos
    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;


    // Enviar datos al servidor
    const response = await fetch("/api/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: username,
            password: password
        })

    });


    // Leer respuesta
    const data = await response.json();


    // Comprobar resultado
    if (response.ok) {

        message.textContent =
            "Login correcto. Bienvenido " +
            data.username;

        message.style.color = "green";


        // Por ahora vamos al panel
        setTimeout(() => {

            window.location.href = "/admin.html";

        }, 1000);


    } else {

        message.textContent =
            data.error ||
            "Usuario o contraseña incorrectos.";

        message.style.color = "red";

    }

});
