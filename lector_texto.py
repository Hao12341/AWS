import boto3
import os
import json

rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    # Datos del evento S3
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    # Intentar detectar texto
    text_response = rekognition.detect_text(
        Image={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    
    detected_text = [
        item['DetectedText']
        for item in text_response['TextDetections']
        if item['Type'] == 'LINE'
    ]
    
    # Preparar datos de salida
    if detected_text:
        report_data = {
            "tipo": "texto",
            "resultado": detected_text
        }
    else:
        # Si no hay texto, buscar etiquetas (objetos/personas)
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
    
    # Guardar como archivo JSON
    report_key = "reportes/" + os.path.splitext(key)[0] + ".json"
    
    s3.put_object(
        Bucket=bucket,
        Key=report_key,
        Body=json.dumps(report_data).encode('utf-8'),
        ContentType='application/json'
    )
    
    return {
        'statusCode': 200,
        'body': f"Reporte generado en formato JSON: s3://{bucket}/{report_key}"
    }
