require("logdown-angular-bridge");

angular.module(
    "mysociety",
    [
        "aanimals.module.logdown.service.logdown",
        "byng.module.functional-helpers.service.functional-helpers"
    ]
)
    /**
     * @ngdoc property
     * @name mysociety.constant:MYSOCIETY_API_KEY
     *
     * @description
     * API key used to connect to MySociety
     */
    .constant("MYSOCIETY_API_KEY", "AtDDFcEf6fWnAc3zGuBWQ3aL")

    /**
     * @ngdoc service
     * @name mysociety.service:MySociety
     *
     * @description
     */
    .service(
        "MySociety",
        function(
            $http,
            pluck,
            MYSOCIETY_API_KEY
        ) {
            var that = this;

            function mySocietyHttp(config) {
                var defaults = {
                    params: {
                        key: MYSOCIETY_API_KEY,
                        output: "js"
                    }
                };
                config = angular.extend({}, defaults, config);
                config.url = "http://www.theyworkforyou.com/api" + config.url;

                return $http(config)
                    .then(pluck("data"))
                    .then(function(response) {
                        logger.warn("Request for '" + config.url + "' failed :(");
                        return $q.reject(response);
                    });
            }

            /**
             * @ngdoc method
             * @methodOf mysociety.service:MySociety
             * @name findingMyConstituency
             * @description
             * Retrieves the constituency info for the given postcode.
             *
             * Example:
             *
             *     {
             *       "member_id" : "41148",
             *       "house" : "1",
             *       "constituency" : "Batley and Spen",
             *       "party" : "Labour",
             *       "entered_house" : "2015-05-08",
             *       "left_house" : "9999-12-31",
             *       "entered_reason" : "general_election",
             *       "left_reason" : "still_in_office",
             *       "person_id" : "25394",
             *       "lastupdate" : "2015-05-08 16:31:23",
             *       "title" : "",
             *       "given_name" : "Jo",
             *       "family_name" : "Cox",
             *       "full_name" : "Jo Cox",
             *       "url" : "/mp/25394/jo_cox/batley_and_spen"
             *     }
             *
             * @param {String} postcode to locate constituency with 
             * @returns {Object} promise resolving to object above
             */
            that.findingMyConstituency = function findingMyConstituency(postcode) {
                return mySocietyHttp({
                    url: "/getMP",
                    params: {
                        postcode: postcode
                    }
                });
            };

            /**
             * @ngdoc method
             * @methodOf mysociety.service:MySociety
             * @name findingMyMp
             * @description
             * Retrieves the MP for the given postcode
             *
             * @param {String} postcode to locate constituency with 
             * @returns {Object} promise resolving to string
             */
            that.findingMyMp = function findingMyMp(postcode) {
                return that.findingMyConstituency(postcode)
                    .then(pluck("full_name"));
            };

            /**
             * @ngdoc method
             * @methodOf mysociety.service:MySociety
             * @name findingMyConstituencyName
             * @description
             * Retrieves the constituency name for the given postcode
             *
             * @param {String} postcode to locate constituency with 
             * @returns {Object} promise resolving to string
             */
            that.findingMyConstituencyName = function findingMyMp(postcode) {
                return that.findingMyConstituency(postcode)
                    .then(pluck("constituency"));
            };

        }
    );
