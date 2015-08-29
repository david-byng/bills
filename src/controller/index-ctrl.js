require("angular");
require("logdown-angular-bridge");
require("../service/mysociety-service.js");
require("../service/parliament-service.js");

angular.module(
    "bills.controller.index",
    [
        "aanimals.module.logdown.service.logdown",
        "mysociety",
        "parliament"
    ]
)
    .controller("IndexCtrl", function($scope) {

    });
