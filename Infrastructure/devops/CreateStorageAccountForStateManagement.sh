#!/bin/bash

set -a
. ./pulumi-state-settings.txt
set +a

if [[ $STORAGE_ACCOUNT_NAME == *"<shortProjectName>pulumistate"* ]];
then
	echo "*** CONFIG ERROR: Please set 'STORAGE_ACCOUNT_NAME' to correct name for your project in pulumi-state-settings.txt ***"
elif [[ $GROUP_NAME == *"<shortProjectName>-pulumi-state"* ]]
then
	echo "*** CONFIG ERROR: Please set 'GROUP_NAME' to correct name for your project in pulumi-state-settings.txt ***"
elif [[ $OWNER == *"<OwnerName>"* ]]
then
	echo "*** CONFIG ERROR: Please set 'OWNER' to correct name for your project in pulumi-state-settings.txt ***"
elif [[ $SUBSCRIPTION == *"<Name of your subscription>"* ]]
then
	echo "*** CONFIG ERROR: Please set the 'SUBSCRIPTION' for your project in pulumi-state-settings.txt ***"
elif [[ $KEY_VAULT_NAME == *"<shortProjectName>-pulumi-state-<dataCentre>-kv"* ]]
then
	echo "*** CONFIG ERROR: Please set the 'KEY_VAULT_NAME' for your project in pulumi-state-settings.txt ***"
else
# If you happen to have these declared from somewhere else, the container creation will fail
	unset AZURE_STORAGE_KEY
	unset AZURE_STORAGE_ACCOUNT

    az account set -s "$SUBSCRIPTION"

    CurrentUserUPN=$(az account show --query user.name -o tsv)

    az group create --name $GROUP_NAME --location $LOCATION --tags Owner=$OWNER Environment=Experiment

    az storage account create --resource-group $GROUP_NAME --name $STORAGE_ACCOUNT_NAME --sku Standard_LRS --encryption-services blob --access-tier cool --kind BlobStorage --min-tls-version TLS1_2 --tags Environment=$ENVIRONMENT Scale=Normal --allow-blob-public-access false

    az storage container create --name $CONTAINER_NAME --account-name $STORAGE_ACCOUNT_NAME

    az keyvault create --enable-purge-protection true --location $LOCATION --name $KEY_VAULT_NAME --resource-group $GROUP_NAME

    az keyvault key create --vault-name $KEY_VAULT_NAME --name "pulumiKey" --protection software

    echo "az keyvault set-policy -n $KEY_VAULT_NAME --resource-group $GROUP_NAME --key-permissions encrypt decrypt get list --upn $CurrentUserUPN"
    az keyvault set-policy -n $KEY_VAULT_NAME --resource-group $GROUP_NAME --key-permissions encrypt decrypt get list --upn $CurrentUserUPN
fi
