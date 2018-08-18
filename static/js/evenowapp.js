angular.module('evenowapp', []).controller('evenowcontroller', ['$scope', function($scope) {

    // alias controller
    var encontrol = this;


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


    // settings
    $scope.settings = {};
    $scope.settings.visible = false;
    $scope.settings.viewmode = 'blend';

    $scope.togglesettings = function() {
        $scope.settings.visible = !$scope.settings.visible;
        // ...
    };

    $scope.$watch('settings.viewmode', function(ov, nv) {
        if (nv !== ov) {
            setTimeout($scope.togglesettings, 200);
        }
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
                        backgroundColor: 'rgba(255, 255, 255, .1)',
                        pointBackgroundColor: 'white',
                        pointRadius: 3,
                        lineTension: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    legend: {
                        display: false
                    },
                    layout: {
                        padding: {
                            left: 10,
                            right: 10,
                            top: 10,
                            bottom: 10
                        }
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

.directive('chartbar', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            setTimeout(function() {
                element[0].style.opacity = '1.0';
                element[0].querySelector('.bar').style.width = attrs.widthVal + '%';
            }, 200);
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
