const AWS = require("aws-sdk");
const fs = require("fs");

async function uploadLargeFile(bucketName, filePath, keyName) {
  // Create a new S3 client
  const s3 = new AWS.S3();

  // Initiate the multipart upload
  const uploadParams = {
    Bucket: bucketName,
    Key: keyName,
  };
  const uploadData = await s3.createMultipartUpload(uploadParams).promise();
  const uploadId = uploadData.UploadId;

  // Set the desired part size (default: 5MB)
  const partSize = 5 * 1024 * 1024;

  try {
    // Open the file to be uploaded
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;

    // Calculate the number of parts to split the file into
    const partCount = Math.ceil(fileSize / partSize);

    // Initialize an empty array to store the ETag values of each part
    const etags = [];

    // Iterate over the file parts
    for (let i = 0; i < partCount; i++) {
      // Calculate the byte range for the current part
      const startByte = partSize * i;
      const endByte = Math.min(startByte + partSize, fileSize);

      // Read the part data from the file
      const fileData = fs.readFileSync(filePath, {
        start: startByte,
        end: endByte - 1,
      });

      // Create a new part
      const partParams = {
        Body: fileData,
        Bucket: bucketName,
        Key: keyName,
        PartNumber: i + 1,
        UploadId: uploadId,
      };
      const partData = await s3.uploadPart(partParams).promise();

      // Add the ETag of the uploaded part to the array
      etags.push({
        PartNumber: i + 1,
        ETag: partData.ETag,
      });
    }

    // Complete the multipart upload
    const completeParams = {
      Bucket: bucketName,
      Key: keyName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: etags,
      },
    };
    await s3.completeMultipartUpload(completeParams).promise();
  } catch (error) {
    // Abort the multipart upload in case of error
    const abortParams = {
      Bucket: bucketName,
      Key: keyName,
      UploadId: uploadId,
    };
    await s3.abortMultipartUpload(abortParams).promise();
    throw error;
  }
}

// Usage example
const bucketName = "your-bucket-name";
const filePath = "path/to/your/large/file";
const keyName = "your-object-key";

uploadLargeFile(bucketName, filePath, keyName)
  .then(() => {
    console.log("File upload complete.");
  })
  .catch((error) => {
    console.error("File upload failed:", error);
  });