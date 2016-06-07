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
        $scope.time = time.format('YYYY-DD-MM H:mm:ss a');
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
            var chart = new Chart(canvaselem, {
                type: 'bar',
                data: {
                    labels: emptylabels,
                    datasets: [{
                        label: 'Price',
                        data: scope.item.avghistorycents,
                        borderWidth: 2,
                        borderColor: 'transparent',
                        backgroundColor: 'rgba(255, 255, 255, .95)'
                    }]
                },
                options: {
                    // responsive: false,
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

.filter('humanizenumber', ['numberFilter', function(numberFilter) {
    return function(input) {

        // humanize very large numbers
        var units = '';
        var output = input;

        // billions
        if ( input >= 1000000000 ) {
            units = 'B';
            output = input / 1000000000;
        }

        // millions
        if ( input >= 1000000 ) {
            units = 'M';
            output = input / 1000000;
        }

        output = numberFilter(output, 2)

        return output + units;

    };
}]);
