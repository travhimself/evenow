angular.module('evenowapp', []).controller('evenowcontroller', ['$scope', function($scope) {

    // alias controller
    var encontrol = this;


    // cache selectors
    encontrol.$body = angular.element(document).find('body');
    encontrol.$charts = angular.element(document).find('canvas');


    // start clock
    $scope.time = '...';
    var time = moment.utc();
    var tickclock = function() {
        time.add(1, 's');
        $scope.datetime = time.format('YYYY-DD-MM H:mm:ss');
        $scope.date = time.format('YYYY-DD-MM');
        $scope.time = time.format('H:mm:ss');
        $scope.$apply();
    };
    setInterval(tickclock, 1000);


    // establish socket connection
    var socket = io('http://localhost:3002');

    socket.on('updateworlddata', function (data) {
        // apply new data
        $scope.data = data;

        // reset timer
        $scope.loaderwaiting = false;
        $scope.$apply();
        setInterval( function() {
            $scope.loaderwaiting = true;
            $scope.$apply();
        }, 1000);
    });
}])

.directive('enmarketitem', function() {
    return {
        restrict: 'A',
        templateUrl: '/partials/marketitem.html',
        replace: true,
        link: function(scope, element, attrs) {

            // draw chart
            var emptylabels = [];
            scope.item.avghistorycents = [];
            scope.item.avghistory.forEach( function(val, index) {
                emptylabels.push('');
                scope.item.avghistorycents.push(val/100);
            });

            var canvaselem = element[0].querySelector('canvas');
            new Chart(canvaselem, {
                type: 'line',
                data: {
                    labels: emptylabels,
                    datasets: [{
                        label: 'Price',
                        data: scope.item.avghistorycents,
                        borderWidth: 2,
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, .1)', // rgba(52, 152, 219, .9)
                        pointRadius: 0
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    animation: false,
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            display: false
                        }],
                        yAxes: [{
                            display: false
                        }]
                    }
                }
            });
        }
    };
})

.directive('enincursionitem', function() {
    return {
        restrict: 'A',
        templateUrl: '/partials/incursionitem.html',
        replace: true,
        link: function(scope, element, attrs) {

            // ...
        }
    };
})

.directive('ensystemkillsitem', function() {
    return {
        restrict: 'A',
        templateUrl: '/partials/systemkillsitem.html',
        replace: true,
        link: function(scope, element, attrs) {

            // ...
        }
    };
})

.directive('ensystemjumpsitem', function() {
    return {
        restrict: 'A',
        templateUrl: '/partials/systemjumpsitem.html',
        replace: true,
        link: function(scope, element, attrs) {

            // ...
        }
    };
})

.directive('enfactionitem', function() {
    return {
        restrict: 'A',
        templateUrl: '/partials/factionitem.html',
        replace: true,
        link: function(scope, element, attrs) {

            // ...
        }
    };
})

.filter('humanizenumber', ['numberFilter', function(numberFilter) {
    return function(input) {

        // convert to cents
        input = input/100;

        // humanize very large numbers
        var units = '';
        var output = input;

        if ( Math.abs(input) >= 1000000000 ) {
            // billions
            units = 'B';
            output = input / 1000000000;
        } else if ( Math.abs(input) >= 1000000 ) {
            // millions
            units = 'M';
            output = input / 1000000;
        } else if ( Math.abs(input) >= 10000 ) {
            // thousands (if greater than tens of thousands)
            units = 'K';
            output = input / 1000;
        }

        output = numberFilter(output, 2)

        return output + units;
    };
}]);
