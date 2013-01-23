from PIL import Image, ImageDraw
import datetime
import os

def create_random_image(filename=None):
    if not filename:
        filename = "test_randomimg_%s.%s" % (datetime.datetime.utcnow().strftime("%s"), "png")
    save_as = os.path.join("/tmp", filename)
    # Create a random image
    img = Image.new('RGB', (100,100), (255,255,255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(25,25), (75,75)], (100,100,100), (0,0,0))
    img.save(save_as)

    return save_as
