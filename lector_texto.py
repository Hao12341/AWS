import boto3
import os
import json

rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    # Datos del evento S3
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    # Asegurarse de que el archivo venga de la carpeta imagenes/
    if not key.startswith("images/"):
        return {
            'statusCode': 400,
            'body': 'El archivo no está en la carpeta imagenes/.'
        }

    # Procesar con Rekognition - detectar texto
    text_response = rekognition.detect_text(
        Image={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    
    detected_text = [
        item['DetectedText']
        for item in text_response['TextDetections']
        if item['Type'] == 'LINE'
    ]
    
    # Si no hay texto, buscar etiquetas
    if detected_text:
        report_data = {
            "tipo": "texto",
            "resultado": detected_text
        }
    else:
        label_response = rekognition.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': key}},
            MaxLabels=10,
            MinConfidence=70
        )
        etiquetas = [
            {"nombre": label["Name"], "confianza": round(label["Confidence"], 2)}
            for label in label_response["Labels"]
        ]
        report_data = {
            "tipo": "etiquetas",
            "resultado": etiquetas
        }
    
    # Crear ruta para json/ usando el nombre base del archivo sin extensión
    filename = os.path.splitext(os.path.basename(key))[0]
    report_key = f"json/{filename}.json"
    
    # Subir resultado a S3
    s3.put_object(
        Bucket=bucket,
        Key=report_key,
        Body=json.dumps(report_data).encode('utf-8'),
        ContentType='application/json'
    )
    
    return {
        'statusCode': 200,
        'body': f"Reporte JSON generado: s3://{bucket}/{report_key}"
    }
