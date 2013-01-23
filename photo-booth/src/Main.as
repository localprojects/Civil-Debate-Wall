package
{
    import com.adobe.images.JPGEncoder;
    
    import flash.display.Bitmap;
    import flash.display.BitmapData;
    import flash.display.Shape;
    import flash.display.Sprite;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.ErrorEvent;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.events.MouseEvent;
    import flash.events.SecurityErrorEvent;
    import flash.events.TimerEvent;
    import flash.external.ExternalInterface;
    import flash.geom.Rectangle;
    import flash.media.Camera;
    import flash.media.Video;
    import flash.net.URLLoader;
    import flash.net.URLLoaderDataFormat;
    import flash.net.URLRequest;
    import flash.net.URLRequestMethod;
    import flash.net.URLVariables;
    import flash.utils.ByteArray;
    import flash.utils.Timer;
    
    [SWF(width="550", height="450", backgroundColor="#FFFFFF", frameRate="30")]
    public class Main extends Sprite
    {
        private var captureWidth:int;
        private var captureHeight:int;
        private var previewWidth:int;
        private var previewHeight:int;
        private var outputWidth:int;
        private var outputHeight:int;
        private var cropX:int;
        private var cropY:int;
        private var cropWidth:int;
        private var cropHeight:int;
        private var cropOverlayColor:uint;
        private var cropOverlayAlpha:Number;
        private var fps:int;
        private var postUrl:String;
        private var postField:String;
        private var postPhotoErrorFunction:String;
        private var postPhotoCompleteFunction:String;
        
        private var camera:Camera;
        private var videoContainer:Sprite;
        private var video:Video;
        private var bitmapData:BitmapData;
        private var preview:Bitmap;
        private var cropOverlay:Sprite;
        private var captureButton:Sprite;
        private var resetButton:Sprite;
        private var submitButton:Sprite;
        
        public function Main()
        {
            postUrl = loaderInfo.parameters.postUrl || "http://dev.www.civildebatewall.com:8080/profile/photo";
            postField = loaderInfo.parameters.postField || "photo";
            captureWidth = int(loaderInfo.parameters.captureWidth) || 960;
            captureHeight = int(loaderInfo.parameters.captureHeight) || 720;
            previewWidth = int(loaderInfo.parameters.previewWidth) || 530;
            previewHeight = int(loaderInfo.parameters.previewHeight) || 398;
            outputWidth = int(loaderInfo.parameters.outputWidth) || 960;
            outputHeight = int(loaderInfo.parameters.outputHeight) || 720;
            fps = int(loaderInfo.parameters.fps) || 24;
            cropX = int(loaderInfo.parameters.cropX) || 0;
            cropY = int(loaderInfo.parameters.cropY) || 0;
            cropWidth = int(loaderInfo.parameters.cropWidth) || outputWidth;
            cropHeight = int(loaderInfo.parameters.cropHeight) || outputHeight;
            cropOverlayColor = uint(loaderInfo.parameters.cropOverlayColor) || 0x000000;
            cropOverlayAlpha = Number(loaderInfo.parameters.cropOverlayAlpha) || 0.75;
            postPhotoErrorFunction = loaderInfo.parameters.postPhotoErrorFunction || "userPhotoPostError";
            postPhotoCompleteFunction = loaderInfo.parameters.postPhotoCompleteFunction || "userPhotoPostComplete";
            
            stage.align = StageAlign.TOP_LEFT;
            stage.scaleMode = StageScaleMode.NO_SCALE;
            
            if(!Camera.isSupported || Camera.names.length == 0) {
                trace('no web cam??');
                ExternalInterface.call("userPhotoNoWebCam");
            } else {
                camera = Camera.getCamera();
                camera.setQuality(0, 100);
                camera.setMode(captureWidth, captureHeight, fps);
                
                videoContainer = new Sprite();
                addChild(videoContainer);
                
                video = new Video(captureWidth, captureHeight);
                video.smoothing = true;
                video.attachCamera(camera);
                videoContainer.addChild(video);
                
                //video.scaleX = video.scaleY = previewHeight / outputHeight;
                video.width = previewWidth;
                video.height = previewHeight;
                video.x = video.y = 10;
                
                videoContainer.graphics.beginFill(0x000000);
                videoContainer.graphics.drawRect(video.x, video.y, video.width, video.height);
                
                cropOverlay = new Sprite();
                cropOverlay.graphics.beginFill(cropOverlayColor, cropOverlayAlpha);
                cropOverlay.graphics.drawRect(0, 0, outputWidth, outputHeight);
                cropOverlay.graphics.drawRect(cropX, cropY, cropWidth, cropHeight);
                cropOverlay.graphics.endFill();
                var ratio:Number = video.height / outputHeight;
                cropOverlay.scaleX = cropOverlay.scaleY = ratio;
                //cropOverlay.x = Math.round(video.width / 2 - cropOverlay.width / 2);
                //addChild(cropOverlay);
                
                var personOverlay:Bitmap = new PersonOverlayBitmap();
                personOverlay.x = video.x + Math.round(video.width / 2 - personOverlay.width/ 2 );
                personOverlay.y = video.y + video.height - personOverlay.height;
                addChild(personOverlay);
                
                
                //captureButton = new ActionButton(120, 40, "CAPTURE", 0xFFFFFF, 0xEEEEEE, 0x000000, 0x333333);
                captureButton = new BitmapButton(new TakePictureButtonBitmap());
                captureButton.addEventListener(MouseEvent.CLICK, onCaptureClick);
                captureButton.x = video.x + Math.round(video.width / 2 - captureButton.width / 2);
                captureButton.y = video.y + video.height + 5;
                addChild(captureButton);
                
                //resetButton = new ActionButton(120, 40, "RESET", 0xFFFFFF, 0xEEEEEE, 0x000000, 0x333333);
                resetButton = new BitmapButton(new CancelPhotoButtonBitmap());
                resetButton.addEventListener(MouseEvent.CLICK, onResetClick);
                resetButton.x = video.x + Math.round(video.width / 2 - 5 - resetButton.width);
                resetButton.y = video.y + video.height + 5;
                resetButton.visible = false;
                addChild(resetButton);
                
                //submitButton = new ActionButton(120, 40, "SUBMIT", 0xFFFFFF, 0xEEEEEE, 0x000000, 0x333333);
                submitButton = new BitmapButton(new SetPhotoButtonBitmap());
                submitButton.addEventListener(MouseEvent.CLICK, onSubmitClick);
                submitButton.x = video.x + Math.round(video.width / 2 + 5);
                submitButton.y = video.y + video.height + 5;
                submitButton.visible = false;
                addChild(submitButton);
            }
        }
        
        private function onCaptureClick(event:MouseEvent):void 
        {
            capture();
        }
        
        private function onResetClick(event:MouseEvent):void 
        {
            reset();
        }
        
        private function onSubmitClick(event:MouseEvent):void 
        {
            postPhoto();
        }
        
        private function capture():void 
        {
            videoContainer.visible = false;
            
            video.width = outputWidth;
            video.height = outputHeight;
            video.x = -cropX;
            video.y = -cropY;
            
            bitmapData = new BitmapData(cropWidth, cropHeight, false, 0x000000);
            bitmapData.draw(videoContainer, null, null, null, new Rectangle(0, 0, cropWidth, cropHeight), true);
            
            reset();
            
            video.visible = false;
            
            preview = new Bitmap(bitmapData);
            var ratio:Number = previewHeight / outputHeight;
            preview.scaleX = preview.scaleY = ratio;
            preview.x = video.x + Math.round(video.width / 2 - preview.width / 2); 
            preview.y = 10;
            addChild(preview);
            
            captureButton.visible = false;
            resetButton.visible = submitButton.visible = true;
        }
        
        private function reset():void 
        {
            try {
                preview.bitmapData.dispose();
                removeChild(preview);
                preview = null;
            } catch(e:Error) { }
            
            captureButton.visible = true;
            resetButton.visible = submitButton.visible = false;
            
            video.width = previewWidth;
            video.height = previewHeight;
            video.x = video.y = 10;
            videoContainer.visible = true;
            video.visible = true;
        }
        
        private function postPhoto():void 
        {
            var urlLoader:URLLoader = new URLLoader();
            var byteArray:ByteArray;			
            
            var jpgEncoder:JPGEncoder = new JPGEncoder(98);
            byteArray = jpgEncoder.encode(bitmapData);
            
            var request:URLRequest = new URLRequest(postUrl);
            request.method = URLRequestMethod.POST;
            
            var variables:URLVariables = new URLVariables();
            variables[postField] = Base64.encode(byteArray);
            request.data = variables;
            
            urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onPostError);
            urlLoader.addEventListener(Event.COMPLETE, onPostComplete);
            urlLoader.addEventListener(IOErrorEvent.IO_ERROR, onPostError);
            urlLoader.dataFormat = URLLoaderDataFormat.TEXT;
            urlLoader.load(request);
            mouseChildren = false;
        }
        
        private function removePostListeners(urlLoader:URLLoader):void 
        {
            mouseChildren = true;
            reset();
            urlLoader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, onPostError);
            urlLoader.removeEventListener(Event.COMPLETE, onPostComplete);
            urlLoader.removeEventListener(IOErrorEvent.IO_ERROR, onPostError);
        }
        
        private function onPostError(event:ErrorEvent):void 
        {
            var urlLoader:URLLoader = event.target as URLLoader;
            removePostListeners(urlLoader);
            try {
                ExternalInterface.call(postPhotoErrorFunction);
            } catch(e:Error) { }
        }
        
        private function onPostComplete(event:Event):void 
        {
            var urlLoader:URLLoader = event.target as URLLoader;
            removePostListeners(urlLoader);
            urlLoader.removeEventListener(Event.COMPLETE, onPostComplete);
            try {
                ExternalInterface.call(postPhotoCompleteFunction);
            } catch(e:Error) { }   
        }
    }
}