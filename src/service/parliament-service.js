require("angular");
require("logdown-angular-bridge");

angular.module(
    "parliament",
    [
        "aanimals.module.logdown.service.logdown"
    ]
)
    /**
     * @ngdoc service
     * @name parliament.service:Parliament
     *
     * @description
     * Simplifies making requests to the Parliament API
     */
    .factory(
        "ParliamentHttp",
        function(
            $http, $q,
            Logdown
        ) {
            var logger = new Logdown({ prefix: "ParliamentHttp" });

            function ParliamentHttp(config) {
                // add prefix
                config.url = "/parliament" + config.url;
                // make request
                logger.debug("Making request to '" + config.url + "'");
                return $http(config)
                    .then(function(response) {
                        // unwrap data
                        return response.data;
                    })
                    .catch(function(response) {
                        logger.warn("request '" + config.url + "' failed");
                        // unwrap data
                        return $q.reject(response.data);
                    });
            };

            /**
             * @ngdoc method
             * @name getBills
             * @methodOf parliament.service:Parliament
             *
             * @description
             * Returns bills, paginated ten at a time
             *
             * example: 
             *
             *     {
             *         _about: "",
             *         ballotNumber: {},
             *         billAgents: [],
             *         billPublications: [],
             *         billStages: [],
             *         billType: "",
             *         billTypeDescription: "",
             *         date: {},
             *         description: [],
             *         homePage: "",
             *         isPrimaryTopicOf: "",
             *         label: {},
             *         moneyBill: false,
             *         originatingLegislature: {},
             *         privateBill: false,
             *         publicBill: true,
             *         publicCanGetInvolved: false,
             *         session: [],
             *         sponsors: [],
             *         title: ""
             *     }
             *
             * @param {Integer} page page number to return
             * @returns {Object} promise resolving to the bill data
             */
            that.getBills = function getBills(page) {
                page = page || 0;
                var params = {};
                if (page) {
                    params.page = page;
                }

                that.gettingSession()
                    .then(function(session) {

                        return ParliamentHttp({
                            url: "/bills.json",
                            params: params
                        })
                    })

                    .then(pluck("result"))
                    .then(pluck("primaryTopic"))
                    .then(function(bill) {

                    });
            };

            /**
             * @ngdoc method
             * @name gettingSession
             * @methodOf parliament.service:Parliament
             *
             * @description
             * Gets the current parliamentary session
             *
             * example:
             *
             * {
             *     _about: "http://data.parliament.uk/resources/377318",
             *     displayName: "2015-2016",
             *     parliament: "http://data.parliament.uk/resources/377308",
             *     sessionNumber: {
             *         _value: "1"
             *     },
             *     startDate: {
             *         _value: "2015-05-18",
             *         _datatype: "dateTime"
             *     }
             * }
             *
             * @returns {Object} promise resolving to session info
             */
            that.gettingSession = function gettingSession() {
                // http://lda.data.parliament.uk/sessions.json?min-displayName=2014-2015&_sort=-displayName
                var year = (new Date()).getFullYear();
                 
                return ParliamentHttp({
                    url: "/sessions.json",
                    params: {
                        "min-displayName": (year - 1) + "-" + year,
                        "_sort": "-displayName",
                        "max-startDate": "2015-08-29"
                    }
                })
                    .then(pluck("items"))
                    .then(pluck(0));
            };
        }
    );
