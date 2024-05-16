const AWS = require('aws-sdk');
const Jimp = require('jimp');
const ses = new AWS.SES({ region: 'ap-south-1' });
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
    try {
        // Process each record in the event
        for (const record of event.Records) {
            const s3Record = record.s3;
            const bucket = s3Record.bucket.name;
            const key = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));
            
            // Log bucket and key information
            console.log('Processing object:', key, 'from bucket:', bucket);
            
            const getObjectParams = {
                Bucket: bucket,
                Key: key
            };
            
            const objectDetails = await s3.headObject(getObjectParams).promise();
            
            // Log object details
            console.log('Object details:', objectDetails);
            
            const emailParams = {
                Destination: {
                    ToAddresses: ['pranavjain284@gmail.com'] // Add your recipient email addresses here
                },
                Message: {
                    Body: {
                        Text: { Data: `S3 URI: s3://${bucket}/${key}\nObject Name: ${key}\nObject Size: ${objectDetails.ContentLength} bytes\nObject Type: ${objectDetails.ContentType}` }
                    },
                    Subject: { Data: 'S3 Upload Notification' }
                },
                Source: 'pranavjain284@gmail.com' // Add your sender email address here
            };
            
            // Log email parameters
            console.log('Sending email with parameters:', emailParams);
            
            await ses.sendEmail(emailParams).promise();

            // Check if the uploaded file is an image
            if (objectDetails.ContentType.includes('image')) {
                const imageObject = await s3.getObject(getObjectParams).promise();
                const image = await Jimp.read(imageObject.Body);
                const thumbnail = await image.resize(50, Jimp.AUTO).getBufferAsync(Jimp.MIME_JPEG);
                
                const putObjectParams = {
                    Bucket: bucket,
                    Key: `${key}-thumbnail.jpg`,
                    Body: thumbnail
                };
                
                // Log thumbnail creation parameters
                console.log('Creating thumbnail with parameters:', putObjectParams);
                
                await s3.putObject(putObjectParams).promise();
            }
        }
        
        return 'Success';
    } catch (error) {
        console.error(error);
        throw error;
    }
};

