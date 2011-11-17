"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
def get_class_by_name(clazz):
    """
    Get a reference to a class by name.  For example::
    
        BeerClass = get_class_by_name('project.models.Beer')
        newBeer = BeerClass() 
    
    :param clazz: The class or function name
    """
    parts = clazz.split('.')
    module = ".".join(parts[:-1])
    m = __import__( module )
    for comp in parts[1:]:
        m = getattr(m, comp)            
    return m