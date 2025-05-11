const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const resultado = document.getElementById('resultado');
const uploadButton = document.getElementById('uploadButton'); // Asegúrate de tener un botón para subir

// Configuración del bucket de S3
const s3BucketUrl = "https://proyecto-hao.s3.amazonaws.com";  // Usar el nombre del bucket correctamente
const s3BucketName = "proyecto-hao";  // Nombre del bucket de S3
const imagePrefix = "images/";  // Prefijo para las imágenes
const jsonPrefix = "json/";  // Prefijo para los archivos JSON

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Mostrar vista previa de la imagen
    const reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
        preview.hidden = false;
    };
    reader.readAsDataURL(file);

    // Guardar el nombre del archivo sin la extensión
    const fileName = file.name.split('.')[0];

    // Habilitar el botón de carga
    uploadButton.disabled = false;

    // Mensaje inicial de carga
    resultado.textContent = "Preparando para cargar la imagen...";

    // Subir la imagen a S3 cuando se haga clic en el botón de cargar
    uploadButton.addEventListener('click', async () => {
        resultado.textContent = "Subiendo imagen a S3...";

        try {
            // Subir la imagen a la carpeta "images/" del bucket de S3
            const response = await fetch(`https://proyecto-hao.s3.amazonaws.com/${imagePrefix}${fileName}`, {
                method: 'PUT',
                body: file, // Solo el archivo, no se necesita FormData
                headers: {
                    // Si no necesitas autenticación o credenciales adicionales, puedes omitir los headers
                    // Si la autenticación es necesaria, deberías incluir las cabeceras adecuadas, por ejemplo:
                    // 'Authorization': 'Bearer token',
                    // 'x-amz-acl': 'public-read' (si se requiere acceso público)
                }
            });

            if (response.ok) {
                resultado.textContent = "Imagen subida correctamente. Esperando que Lambda genere el archivo JSON...";

                // Esperar a que el archivo JSON se genere y se cargue en S3
                const jsonUrl = `https://proyecto-hao.s3.amazonaws.com/${jsonPrefix}${fileName}.json`;

                // Intentar obtener el JSON con reintentos si no está disponible inmediatamente
                let attempts = 0;
                let jsonResponse;
                while (attempts < 5) {
                    jsonResponse = await fetch(jsonUrl);
                    if (jsonResponse.ok) {
                        const jsonData = await jsonResponse.json();
                        resultado.textContent = "Archivo JSON generado y recuperado correctamente!";
                        resultado.textContent += "\n" + JSON.stringify(jsonData, null, 2); // Mostrar el resultado en formato bonito
                        break;
                    } else {
                        attempts++;
                        resultado.textContent = `Esperando respuesta del JSON... Intento ${attempts}/5`;
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos antes de intentar de nuevo
                    }
                }

                if (!jsonResponse.ok) {
                    resultado.textContent = '❌ El archivo JSON no está disponible todavía después de varios intentos.';
                }

            } else {
                resultado.textContent = "❌ Error al subir la imagen a S3.";
            }
        } catch (error) {
            resultado.textContent = "❌ Error al cargar la imagen o al obtener el JSON: " + error.message;
        }
    });
});
