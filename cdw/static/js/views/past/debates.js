

define(['jquery', 
'underscore', 
'backbone',
'config',
'sdate',
'cdw',
'jquery_mobile',
'models/past'
],
    function ($, 
    	_, 
    	Backbone,
    	Config, 
    	Sdate, 
    	Utils,
    	Mobile,
    	PastModel) {


	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	
	var debatesView;

    var DebatesView = Backbone.View.extend({

        el: $("#debates"),

        initialize: function () {
       		 debatesView = this;
            debatesView.models = {};
            debatesView.models.past = new PastModel();
   
             
        },

        
        
        render: function () {    
        	 CDW.utils.misc.setTitle('PAST DEBATES');      
              debatesView.models.past.fetch({
                        
                        dataType: "json",

                        success: function (model, pastdata) {
                        	//console.log(pastdata)
                        //CDW.utils.misc.formatDates(entry.archiveDate)
                       	 	var list="";
                        	for(var i=0;i<pastdata.length;i++){
                        		
                        		var arr = pastdata[i].archiveDate.split(".")[0].split(" ");//clear trailing millis and split get yy-mm-dd part from horus
								var yr = arr[0].split("-");
								//var hr = arr[1].split(":");
								//var posted = new Date(yr[0],yr[1]-1,yr[2],hr[0],hr[1],hr[2],0);
                        		var dStr = yr[1]+'/'+yr[2]+'/'+yr[0];// / = &#47; as html entity
                        		
                        		list+='<li class="ui-li ui-li-divider ui-bar-d" role="heading" data-role="list-divider">'+pastdata[i].category.name+' - '+dStr+'</li>';
                        		
                        		list+='<li ><p><a href="#archive?q='+pastdata[i].id+'&date='+arr[0]+'"">'+pastdata[i].text+'</a></p></li>';
                        	}
                        	
                        	
                        	
                           	$("#debateslist").html(list);
                       		$('#debateslist').listview('refresh');
                         /*_.templateSettings.variable = "main";                        
                         that.$el.find(".tmpl").html(_.template( _pastTemplate, pastdata));*/
                        },
                        error:function(e){
                        	console.log("Past debates error "+e);
                        }
                        

              });
          
          
          
          
          
        
          
        }
    });
    return DebatesView;
});
