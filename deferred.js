var // Promise methods
	promiseMethods = "then done fail isResolved isRejected promise".split( " " ),
	// Static reference to slice
	sliceDeferred = [].slice;

exports._Deferred = function() {
    var // callbacks list
        callbacks = [],
        // stored [ context , args ]
        fired,
        // to avoid firing when already doing so
        firing,
        // flag to know if the deferred has been cancelled
        cancelled,
        // the deferred itself
        deferred  = {
            // done( f1, f2, ...)
            done: function() {
                if ( !cancelled ) {
                    var args = arguments,
                        i,
                        length,
                        elem,
                        _fired;
                    if ( fired ) {
                        _fired = fired;
                        fired = 0;
                    }
                    for ( i = 0, length = args.length; i < length; i++ ) {
                        elem = args[ i ];
                        if ( Array.isArray(elem) ) {
                            deferred.done.apply( deferred, elem );
                        } else if ( typeof(elem) === "function" ) {
                            callbacks.push( elem );
                        }
                    }
                    if ( _fired ) {
                        deferred.resolveWith( _fired[ 0 ], _fired[ 1 ] );
                    }
                }
                return this;
            },

            // resolve with given context and args
            resolveWith: function( context, args ) {
                if ( !cancelled && !fired && !firing ) {
                    // make sure args are available (#8421)
                    args = args || [];
                    firing = 1;
                    try {
                        while( callbacks[ 0 ] ) {
                            callbacks.shift().apply( context, args );
                        }
                    }
                    finally {
                        fired = [ context, args ];
                        firing = 0;
                    }
                }
                return this;
            },

            // resolve with this as context and given arguments
            resolve: function() {
                deferred.resolveWith( this, arguments );
                return this;
            },

            // Has this deferred been resolved?
            isResolved: function() {
                return !!( firing || fired );
            },

            // Cancel
            cancel: function() {
                cancelled = 1;
                callbacks = [];
                return this;
            }
        };

    return deferred;
};

// Full fledged deferred (two callbacks list)
exports.Deferred = function( func ) {
    var deferred = exports._Deferred(),
        failDeferred = exports._Deferred(),
        promise;
    // Add errorDeferred methods, then and promise
    deferred.then = function( doneCallbacks, failCallbacks ) {
        deferred.done( doneCallbacks ).fail( failCallbacks );
        return this;
    };
    deferred.fail = failDeferred.done;
    deferred.rejectWith = failDeferred.resolveWith;
    deferred.reject = failDeferred.resolve;
    deferred.isRejected = failDeferred.isResolved;
    // Get a promise for this deferred
    // If obj is provided, the promise aspect is added to the object
    deferred.promise = function( obj ) {
        if ( obj == null ) {
            if ( promise ) {
                return promise;
            }
            promise = obj = {};
        }
        var i = promiseMethods.length;
        while( i-- ) {
            obj[ promiseMethods[i] ] = deferred[ promiseMethods[i] ];
        }
        return obj;
    };
    // Make sure only one callback list will be used
    deferred.done( failDeferred.cancel ).fail( deferred.cancel );
    // Unexpose cancel
    delete deferred.cancel;
    // Call given func if any
    if ( func ) {
        func.call( deferred, deferred );
    }
    return deferred;
};

// Deferred helper
exports.when = function( firstParam ) {
    var args = arguments,
        i = 0,
        length = args.length,
        count = length,
        deferred = length <= 1 && firstParam && typeof( firstParam.promise ) == 'function' ?
            firstParam :
            exports.Deferred();
    function resolveFunc( i ) {
        return function( value ) {
            args[ i ] = arguments.length > 1 ? sliceDeferred.call( arguments, 0 ) : value;
            if ( !( --count ) ) {
                // Strange bug in FF4:
                // Values changed onto the arguments object sometimes end up as undefined values
                // outside the $.when method. Cloning the object into a fresh array solves the issue
                deferred.resolveWith( deferred, sliceDeferred.call( args, 0 ) );
            }
        };
    }
    if ( length > 1 ) {
        for( ; i < length; i++ ) {
            if ( args[ i ] && typeof( args[ i ].promise ) == 'function') {
                args[ i ].promise().then( resolveFunc(i), deferred.reject );
            } else {
                --count;
            }
        }
        if ( !count ) {
            deferred.resolveWith( deferred, args );
        }
    } else if ( deferred !== firstParam ) {
        deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
    }
    return deferred.promise();
};
