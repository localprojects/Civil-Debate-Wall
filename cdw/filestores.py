import base64, cropresize, os
from boto.s3.connection import S3Connection
from boto.s3.key import Key
from PIL import Image
from flask import current_app

class BaseUserProfileImageStore():
    def _save_images_to_local_disk(self, user, image, storage_dir):
        user_id = str(user.id)
        
        original_filename = "%s.jpg" % user_id
        original_file_path = '%s/%s' % (storage_dir, original_filename)
        
        thumbnail_filename = '%s-%s.jpg' % (user_id, 'thumbnail')
        thumbnail_file_path = '%s/%s' % (storage_dir, thumbnail_filename)
        
        current_app.logger.info("Saving user profile images to: %s" % original_file_path)
        f = open(original_file_path, 'wb')
        f.write(base64.b64decode(image))
        f.close()
        
        im = Image.open(original_file_path);
        thumbnail_image = cropresize.crop_resize(im, (71, 96));
        current_app.logger.info("Saving user profile image thumbnail to: %s" % thumbnail_file_path)
        thumbnail_image.save(thumbnail_file_path, 'JPEG', quality=100)
        
        return {
            "original_filename": original_filename,
            "original_file_path": original_file_path,
            "thumbnail_filename": thumbnail_filename,
            "thumbnail_file_path": thumbnail_file_path,
        }

class LocalUserProfileImageStore(BaseUserProfileImageStore):
    def saveProfileImage(self, user, image):
        result = self._save_images_to_local_disk(user, image, current_app.config['CDW']['IMAGE_STORAGE']['USER_IMAGES'])
        user.setWebProfilePhoto(result['original_filename'], result['thumbnail_filename'])
    
    def getProfileImages(self, user):
        return {
            "large": "large",
            "thumb": "thumb"
        }
        
class S3UserProfileImageStore(BaseUserProfileImageStore):
    def _save_to_s3(self, bucket, file_name, file_path):
        k = Key(bucket)
        k.key = '%s/%s' % (current_app.config['CDW']['IMAGE_STORAGE']['USER_IMAGES'], file_name)
        current_app.logger.info("Saving image to S3: %s >> %s%s" % (file_path, current_app.config['CDW']['AWS']['S3BUCKET'], k.key))
        k.set_contents_from_filename(file_path)
        k.set_acl('public-read')
    
    def saveProfileImage(self, user, image):
        result = self._save_images_to_local_disk(user, image, current_app.config['CDW']['IMAGE_STORAGE']['temp'])
        
        conn = S3Connection(current_app.config['CDW']['AWS']['ACCESS_KEY_ID'], current_app.config['CDW']['AWS']['SECRET_ACCESS_KEY'])
        bucket = conn.get_bucket(current_app.config['CDW']['AWS']['S3BUCKET'])
        
        # Send to S3 after storage
        
        self._save_to_s3(bucket, result['original_filename'], result['original_file_path']);
        self._save_to_s3(bucket, result['thumbnail_filename'], result['thumbnail_file_path']);
        
        # Update the user profile
        user.setWebProfilePhoto(result['original_filename'], result['thumbnail_filename'])
        
        # Delete from local
        os.unlink(result['original_file_path'])
        os.unlink(result['thumbnail_file_path'])