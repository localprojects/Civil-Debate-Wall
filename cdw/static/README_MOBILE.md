PLEASE MOVE TO APPROPRIATE LOCATION

README FOR CDW MOBILE APP
Local Projects
/Andreas Borg
_______________________

Some notes:

The Mobile version of Civil Debate Wall is a single page javascript web app. 

It is making a series of JSONP API queries over AJAX to pull in all data. 

It is making heavy use of the BackboneJS MVC framework to structure everything into models and views. 
It is also using JQUERY and JQUERY MOBILE (JQM) for DOM handling, some AJAX calls, and a lot of GUI.
Both JQM and Backbone have their own way of handling deeplinking and page changes (ie. hash tag routing), and there is no default way of integrating them.
The most elegant way we found is using a JQM router extension that replaces the BackboneJS router all together. What the JQM router does is firing and intercepting all JQM page state events, and thus allowing to create the corresponding Backbone views. Backbone thus is not used to navigate at all. 

Please note that to get this integration to work, the laod order is crucial. To control when diffferent JS files are loaded RequireJS is used.

The application is launched by js/main.js which preloads all UnderscoreJS templates, and ensures all dependencies are laoded in the right order.
On complete the js/app.js is called, and finally js/router.js is called to server up the current page. The router.js is effectively the controller for the whole app.

The in the JQM model all pages are div tags within the same index.html file.  
 
The only CSS file that applies to mobile is found in css/app.css



