using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Azure.Identity;
using Azure.Security.KeyVault.Keys;
using Azure.Security.KeyVault.Keys.Cryptography;
using Azure.Storage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace web.Controllers
{
    public class BlobController : Controller
    {
        private readonly IConfiguration configuration;

        private static BlobServiceClient blobServiceClient;

        public BlobController(IConfiguration configuration)
        {
            this.configuration = configuration;
            
            // this code is obviously super bad! Don't do this!
            // It just means I can avoid using DI for this example, to make it easier to see the code in one place.
            if (blobServiceClient == null)
            {
                blobServiceClient = this.GetBlobServiceClient();
            }
        }

        [HttpGet("/blob")]
        public IActionResult Index()
        {
            const string encryptionDataMeta = "encryptiondata";
            var blobContainerClient = GetBlobContainerClient();
            var blobs = blobContainerClient.GetBlobs(BlobTraits.Metadata);
            // foreach (var blob in blobs)
            // {
            //     if (blob.Metadata.ContainsKey(encryptionDataMeta))
            //     {
            //         Debug.Write(blob.Metadata[encryptionDataMeta]);
            //     }
            // }
            return this.View(blobs);
        }

        [HttpGet("/blob/{name}")]
        public async Task GetBlobAsync(string name)
        {
            // This implementation is completely insecure, don't do this!
            var blobContainerClient = GetBlobContainerClient();
            var blobClient = blobContainerClient.GetBlobClient(name);
            this.Response.StatusCode = 200;
            this.Response.Headers.Add("Content-Disposition", $"inline; filename='{name}'");

            await blobClient.DownloadToAsync(this.Response.Body);
            await this.Response.Body.FlushAsync();
        }

        [HttpPost("/blob")]
        public async Task<IActionResult> PostFileAsync(IFormFile file)
        {
            try
            {
                var blobContainerClient = GetBlobContainerClient();
                var blobName = DateTime.UtcNow.ToString("o").Replace(":","-") + ".txt";
                var blobClient = blobContainerClient.GetBlobClient(blobName);

                using (var inputStream = file.OpenReadStream())
                {
                    blobClient.Upload(inputStream);
                }
                return this.RedirectToAction(nameof(BlobController.Index));
            }
            catch(Exception e)
            {
                throw;
            }
        }

        private BlobContainerClient GetBlobContainerClient()
        {
            var blobContainerClient = blobServiceClient.GetBlobContainerClient("files");
            blobContainerClient.CreateIfNotExists(); // Obviously wasteful, initialise once and keep track instead!
            return blobContainerClient;
        }

        private BlobServiceClient GetBlobServiceClient()
        {
            // NOTE: You should make the BlobServiceClient a singleton in DI rather than doing all this work on each invocation!
            // But, do some multi-day tests and key rotation tests to make sure everything stays OK. It *should*, 
            // because everything is methods, not statically resolved tokens and keys etc.
            var keyVaultUri = this.configuration.GetValue<string>("KeyVaultUri");
            var keyIdentifier = this.configuration.GetValue<string>("BlobEncryptionKeyName");
            var keyName = new Uri($"{keyVaultUri}keys/{keyIdentifier}");
            var azureCredentials = new DefaultAzureCredential();

            // NOTE: This reads the current key version and uses that to encrypt things going forward
            // Problem is that when the key gets rotated, at some point you should update the key being used
            // So, you do need to refresh this occasionally!
            var keyClient = new KeyClient(new Uri(keyVaultUri), azureCredentials);
            var key = keyClient.GetKey(keyIdentifier);


            var cryptoClient = new CryptographyClient(key.Value.Id, azureCredentials);
            var keyResolver = new KeyResolver(new DefaultAzureCredential());

            var encryptionOptions = new ClientSideEncryptionOptions(ClientSideEncryptionVersion.V1_0)
            {
                KeyEncryptionKey = cryptoClient,
                KeyResolver = keyResolver,
                KeyWrapAlgorithm = "RSA-OAEP"
            };

            var blobClientOptions = new SpecializedBlobClientOptions()
            {
                ClientSideEncryption = encryptionOptions
            };
            // Using Managed Identity to access blob storage.
            // Requires correct permissions (RBAC) on the storage account as well as "az login" when running locally
            var blobServiceUrl = this.configuration.GetValue<string>("BlobServiceUri");
            return new BlobServiceClient(new Uri(blobServiceUrl), azureCredentials, blobClientOptions);
        }
    }
}