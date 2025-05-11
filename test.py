import boto3
import json
import uuid

# Configurar el cliente de S3
s3 = boto3.client('s3')

# Especifica el bucket y la ruta del JSON
bucket_name = "proyecto-hao"
filename = f"json/prueba_{uuid.uuid4().hex}.json"

# Crear el contenido del JSON
report_data = {
    "tipo": "prueba",
    "mensaje": "Este es un JSON de prueba",
    "uuid": str(uuid.uuid4())
}

# Subir el archivo JSON a S3
try:
    s3.put_object(
        Bucket=bucket_name,
        Key=filename,
        Body=json.dumps(report_data, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json"
    )
    print(f"JSON subido correctamente: s3://{bucket_name}/{filename}")
except Exception as e:
    print(f"Error al subir JSON: {str(e)}")
