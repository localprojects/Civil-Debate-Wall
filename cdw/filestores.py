"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import base64, cropresize, os
from boto.s3.connection import S3Connection
from boto.s3.key import Key
from PIL import Image
from flask import current_app
from werkzeug import LocalProxy

user_profile_image_store = LocalProxy(lambda: current_app.user_profile_image_store)

def init(app):
    """Initialize application file stores.
    """
    file_stores = { 
        "local": LocalUserProfileImageStore, 
        "s3": S3UserProfileImageStore 
    }
    
    storage_type = app.config['CDW']['image_storage']['type']
    app.user_profile_image_store = file_stores[storage_type]()

class BaseUserProfileImageStore():
    """Base user profile file store
    """
    
    def set_photo(self, user, fullsize, thumbnail):
        user.webProfilePicture = fullsize
        user.webProfilePictureThumbnail = thumbnail
        current_app.cdw.users.save(user)
        
    def _save_images_to_local_disk(self, user, image, storage_dir):
        user_id = str(user.id)
        
        original_filename = "%s-%s.jpg" % (user_id, 'web')
        original_file_path = '%s/%s' % (storage_dir, original_filename)
        
        thumbnail_filename = '%s-%s.jpg' % (user_id, 'thumbnail')
        thumbnail_file_path = '%s/%s' % (storage_dir, thumbnail_filename)
        
        msg = "Saving user profile image to: %s" % original_file_path
        current_app.logger.info(msg)
        
        f = open(original_file_path, 'wb')
        f.write(base64.b64decode(image))
        f.close()
        
        im = Image.open(original_file_path);
        thumbnail_image = cropresize.crop_resize(im, (71, 96));
        
        msg = "Saving user profile image thumbnail to: %s" % thumbnail_file_path
        current_app.logger.info(msg)
        
        thumbnail_image.save(thumbnail_file_path, 'JPEG', quality=100)
        
        return {
            "original_filename": original_filename,
            "original_file_path": original_file_path,
            "thumbnail_filename": thumbnail_filename,
            "thumbnail_file_path": thumbnail_file_path,
        }

class LocalUserProfileImageStore(BaseUserProfileImageStore):
    """Local profile image file store
    """
    def saveProfileImage(self, user, image):
        folder = current_app.config['CDW']['image_storage']['user_images_dir']
        result = self._save_images_to_local_disk(user, image, folder)
        
        self.set_photo(user, 
                       result['original_filename'], 
                       result['thumbnail_filename'])
    
    def getProfileImages(self, user):
        return {
            "large": "large",
            "thumb": "thumb"
        }
        
class S3UserProfileImageStore(BaseUserProfileImageStore):
    """S3 profile image file store
    """
    def _save_to_s3(self, bucket, file_name, file_path):
        folder = current_app.config['CDW']['image_storage']['user_images_dir']
        k = Key(bucket)
        k.key = '%s/%s' % (folder, file_name)
        
        current_app.logger.info("Saving image to S3: %s >> %s%s" % 
                                (file_path, bucket, k.key))
        
        k.set_contents_from_filename(file_path)
        k.set_acl('public-read')
    
    def saveProfileImage(self, user, image):
        temp_dir = current_app.config['CDW']['image_storage']['temp_dir']
        result = self._save_images_to_local_disk(user, image, temp_dir)
        
        key_id = current_app.config['CDW']['aws']['access_key_id']
        secret_key = current_app.config['CDW']['aws']['secret_access_key']
        bucket_name = current_app.config['CDW']['aws']['s3bucket']
        
        conn = S3Connection(key_id, secret_key)
        bucket = conn.get_bucket(bucket_name)
        
        # Send to S3 after storage
        
        self._save_to_s3(bucket, 
                         result['original_filename'], 
                         result['original_file_path']);
                         
        self._save_to_s3(bucket, 
                         result['thumbnail_filename'], 
                         result['thumbnail_file_path']);
        
        # Update the user profile
        self.set_photo(user,
                       result['original_filename'],
                       result['thumbnail_filename'])
        
        # Delete from local
        os.unlink(result['original_file_path'])
        os.unlink(result['thumbnail_file_path'])
        