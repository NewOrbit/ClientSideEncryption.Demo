#!/bin/bash

set -a
. "`dirname "${BASH_SOURCE[0]}"`/pulumi-state-settings.txt"
set +a

if [[ $STORAGE_ACCOUNT_NAME == *"<shortProjectName>pulumistate"* ]];
then
	"*** CONFIG ERROR: Please set 'STORAGE_ACCOUNT_NAME' to correct name for your project in pulumi-state-settings.txt ***"
else
	az account get-access-token -t "$TENANT_ID" -o none || az login -t "$TENANT_ID"
	az account set -s "$SUBSCRIPTION"

	export AZURE_STORAGE_KEY=$(az storage account keys list -g $GROUP_NAME --account-name $STORAGE_ACCOUNT_NAME -o tsv --query [0].value)
	export AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT_NAME
	export AZURE_KEYVAULT_AUTH_VIA_CLI="true"

	pulumi login azblob://$CONTAINER_NAME
fi
