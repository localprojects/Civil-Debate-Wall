package
{
    import flash.display.Bitmap;
    import flash.events.MouseEvent;
    
    import net.nobien.controls.abstract.AbstractButton;
    
    public class BitmapButton extends AbstractButton
    {
        public function BitmapButton(bitmap:Bitmap)
        {
            trace("BitmapButton");
            this.addChild(bitmap);
            this.initialized = true;
        }
        
        override protected function onRollOver(event:MouseEvent):void
        {
            super.onRollOver(event);
            this.alpha = 0.7;
        }
        
        override protected function onRollOut(event:MouseEvent):void
        {
            super.onRollOut(event);
            this.alpha = 1;
        }
    }
}