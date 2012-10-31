var CDW = CDW || {};
                                             
CDW.socialmedia = CDW.socialmedia || {};

CDW.socialmedia.tools = (function (window, document, $, undefined) {

    var tw_dfd = $.Deferred(),
                       
        iframes_dfd = $.Deferred(),
    
        _dfCheck = function() {  
                          
          $.when(iframes_dfd, gp_dfd).then(function(){     
             CDW.socialmedia.tools.renderGooglePlusOne($(".g-plusone-paused"));     
          });
    
          if (queue.length > 0) {
            CDW.socialmedia.tools.framesLoader($(queue.join()));
          } else {
            iframes_dfd.resolve();
          } 
          
        }
        
        framesLoader = function(frames,pos) {       
           pos = pos || 0;
       
           var frame = frames.eq(pos), 
               fc = frames.length, 
               url = frame.attr("data-url");
           
            if(pos < fc) {

               $(frame).one("load", function() {
                 $(this).parent().show();
		 framesLoader(frames, ++pos);
	           });
	           	           
			   $(frame).attr("src", url);
            } else {               
               iframes_dfd.resolve();        
            } 
            
            
	   
          },
    
          loadGooglePlusOne = function(gp) {
       
             gapi.plusone.render (gp.attr("id"), {
                 "size" : gp.attr("data-size"),
                 "annotation": gp.attr("data-annotation"),
                 "width": gp.attr("data-width"),
                 "href" : gp.attr("data-href")
                }
             );
          },
    
          renderGooglePlusOne = function(gps, pos) {       
            pos = pos || 0;
            
            var  gp = gps.eq(pos), 
                 gl = gps.length;
            
            if(pos < gl) {      
              gp.attr("id","g-plusone-"+pos).removeClass("g-plusone-paused");
              loadGooglePlusOne(gp); 
              pos++;
              renderGooglePlusOne(gps, pos);
            }
       
	      };
        

    
    Button = function (cfg) {
       
       this.cfg = $.extend({
         container       : "",
         url             : document.location.href,
         title           : document.title
        }, cfg);
    };

    Button.prototype = {
      
      _services: {
          
          twitter: {
              cfg: {
                text       : undefined,
                via        : undefined || "",
                shorty     : true,
                type       : undefined || "horizontal",           
                related    : undefined
              },

              
              create: function(cfg,button) {
                 
                 var that = this;
                 
                
                
                $(button).html('<iframe class="twitter-tweet" allowtransparency="true" frameborder="0" scrolling="no" data-url="//platform.twitter.com/widgets/tweet_button.html?url='+encodeURIComponent(this.cfg.url)+'&amp;via=nvidiataiwan&amp;text='+encodeURIComponent(this.cfg.title)+'&amp;count=horizontal" style="width:130px; height:20px;" data-url="'+this.cfg.url+'" data-text="'+this.cfg.title+'" data-count="horizontal" data-via="nvidiataiwan"></iframe>')
                
                if ($.inArray("iframe.twitter-tweet", queue) === -1) {
                           queue.push("iframe.twitter-tweet");
                   }
                                            
               tw_dfd.resolve();
                if (that.cfg.types.length === df_queue.length) {
                     _dfCheck()
                  }
              
                   
              }
          
          }
        
        
      },
            
     
      bind: function(svc, selector, cfg) {
   
        cfg = $.extend(true, {}, this._services[svc].cfg, cfg);
         
         if ($.inArray(svc, this.cfg.types) > -1) {
           df_queue.push(df_map[svc]);
         }
       
         
         var that = this,
             button = $(selector);
            
             this._services[svc].create.apply(that, [cfg, button]);
         
        return this;
      }
     
    }
    
     
    var svc;
    for(svc in Button.prototype._services) {
      Button.prototype[svc] = (function(svc) {        
        return function(selector, cfg) {
          return this.bind(svc, selector, cfg);
        };
      }(svc));
    };
    


    return {
    
        button              :Button,
        framesLoader        : framesLoader
    }

})(this, this.document, this.jQuery);
