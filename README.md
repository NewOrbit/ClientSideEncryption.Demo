# Running it
Use the devcontainer in Infrastructure to set up an environment. 
- Manually give yourself CryptUser RBAC on the Key Vault.
- Manually give yourself the "Storage Blob Data Contributor" RBAC on the Storage account.
TODO: Remove the network restrictions on the different services - or do it manually.

Use the devcontainer in `src` to run the code.
NOTE: You must run "az login" in before running the code, to log in to azure and use managed identity. (Could change to enable interactive auth, I guess?)