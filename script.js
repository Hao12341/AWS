const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const resultado = document.getElementById('resultado');

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = () => {
        preview.src = reader.result;
        preview.hidden = false;
    };
    reader.readAsDataURL(file);

    // Esperar el nombre del archivo sin extensión
    const fileName = file.name.split('.')[0];

    // Simula que el JSON ya está disponible en S3 (ajusta la URL)
    const jsonUrl = `https://tu-bucket-s3.s3.amazonaws.com/reportes/${fileName}.json`;

    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error("No se encontró el archivo JSON");

        const data = await response.json();
        resultado.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        resultado.textContent = `❌ Error al cargar el resultado: ${error.message}`;
    }
});
