// js_router.js

js_router = {
    exec: function (controller, action) {
        var ns = itriage_map,
            action = ( action === undefined ) ? "init" : action;

        if (controller !== "" && ns[controller] && typeof ns[controller][action] == "function") {
            ns[controller][action]();
        }
    },

    init: function () {
        var body = document.body,
            controller = body.getAttribute("data-controller"),
            action = body.getAttribute("data-action");

        js_router.exec("common");
        js_router.exec(controller);
        js_router.exec(controller, action);
    }
};