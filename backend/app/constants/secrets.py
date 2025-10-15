import json

import boto3
from botocore.exceptions import ClientError

def _get_secrets_from_aws():
    secret_name = "MySecret"
    region_name = "us-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        return json.loads(client.get_secret_value(
            SecretId=secret_name
        )["SecretString"])
    except ClientError as e:
        raise e

SECRETS = _get_secrets_from_aws()