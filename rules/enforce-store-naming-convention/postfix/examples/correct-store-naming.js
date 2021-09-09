"use strict";
exports.__esModule = true;
exports.mappedStore$ = exports.combinedStore$ = exports.restoredStore$ = exports.justStore$ = void 0;
var effector_1 = require("effector");
// Just createStore
var justStore$ = (0, effector_1.createStore)(null);
exports.justStore$ = justStore$;
// Restore
var eventForRestore = (0, effector_1.createEvent)();
var restoredStore$ = (0, effector_1.restore)(eventForRestore, null);
exports.restoredStore$ = restoredStore$;
// Combine
var combinedStore$ = (0, effector_1.combine)(justStore$, restoredStore$);
exports.combinedStore$ = combinedStore$;
// Map
var mappedStore$ = combinedStore$.map(function (values) { return values.length; });
exports.mappedStore$ = mappedStore$;
