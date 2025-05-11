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

    // Subir la imagen a S3 cuando se haga clic en el botón de cargar
    uploadButton.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        try {
            // Subir la imagen a la carpeta "images/" del bucket de S3
            const response = await fetch(`${s3BucketUrl}/${imagePrefix}${fileName}`, {
                method: 'PUT',
                body: formData,
                headers: {
                    // Aquí puedes agregar cualquier header necesario para la autenticación si es necesario
                }
            });

            if (response.ok) {
                alert("Imagen subida correctamente!");

                // Esperar el nombre del archivo JSON generado por la Lambda
                const jsonUrl = `https://proyecto-hao.s3.amazonaws.com/${jsonPrefix}${fileName}.json`;

                // Esperar a que se genere el JSON y mostrar el resultado
                const jsonResponse = await fetch(jsonUrl);
                if (!jsonResponse.ok) throw new Error("No se encontró el archivo JSON");

                const jsonData = await jsonResponse.json();
                resultado.textContent = JSON.stringify(jsonData, null, 2); // Mostrar el resultado en formato bonito

            } else {
                alert("Error al subir la imagen");
            }
        } catch (error) {
            alert("Error al cargar la imagen o al obtener el JSON: " + error.message);
        }
    });
});
