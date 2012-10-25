package
{
    import flash.display.Sprite;
    import flash.events.MouseEvent;
    import flash.text.TextField;
    
    import net.nobien.controls.abstract.AbstractButton;
    import net.nobien.utils.AlignUtil;
    import net.nobien.utils.TextFieldUtil;
    
    public class ActionButton extends AbstractButton
    {
        private var baseWidth:int;
        private var baseHeight:int;
        private var labelOutColor:uint;
        private var labelOverColor:uint;
        private var baseOutColor:uint;
        private var baseOverColor:uint;
        
        private var label:TextField;
        private var base:Sprite;
        
        public function ActionButton(width:int, height:int, label:String, labelOutColor:uint, labelOverColor:uint, baseOutColor:uint, baseOverColor:uint)
        {
            this.baseWidth = width;
            this.baseHeight = height;
            this.labelOutColor = labelOutColor;
            this.labelOverColor = labelOverColor;
            this.baseOutColor = baseOutColor;
            this.baseOverColor = baseOverColor;
            
            this.base = new Sprite();
            this.label = TextFieldUtil.createPlainTextField(label);
            
            setColors(labelOutColor, baseOutColor);
            
            addChild(this.base);
            addChild(this.label);
            
            AlignUtil.alignMiddleCenter(this.label, this.base.getRect(this));
                
            initialized = true;
        }
        
        private function setColors(labelColor:uint, baseColor:uint):void
        {
            label.textColor = labelColor;
            base.graphics.clear();
            base.graphics.beginFill(baseColor);
            base.graphics.drawRect(0, 0, baseWidth, baseHeight);
            base.graphics.endFill();
        }
        
        override protected function onRollOver(event:MouseEvent):void
        {
            super.onRollOver(event);
            setColors(labelOverColor, baseOverColor);
        }
        
        override protected function onRollOut(event:MouseEvent):void
        {
            super.onRollOut(event);
            setColors(labelOutColor, baseOutColor);
        }
    }
}