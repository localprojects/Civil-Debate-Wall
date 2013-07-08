"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw import app
 
if __name__ == '__main__':

    if app.debug:
        use_debugger = True
    try:
        use_debugger = not(app.config.get('DEBUG_WITH_APTANA'))
    except:
        # Config is invalid, so use-debugger will be default
        pass
    app.run(use_debugger=use_debugger, debug=app.debug, use_reloader=use_debugger, port=app.config['HOST_PORT'], host='0.0.0.0')

