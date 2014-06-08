app.directive('navpublic', function(){
    // Runs during compile
    return {
        scope: true,
        controller: 'NavPubCtrl',
        restrict: 'A',
        templateUrl: 'codetalk-views/public/nav.html',
        link: function(scope, element, attrs) {
            
        }                
    };
});

app.controller('NavPubCtrl', function($scope, $cookies) {
    $scope.state = "Public";
});


app.directive('navprivate', function(){
    // Runs during compile
    return {
        scope: true,
        controller: 'NavPrivCtrl',
        restrict: 'A',
        templateUrl: 'codetalk-views/private/nav.html',
        link: function(scope, element, attrs) {
            
        }
    };
});

app.controller('NavPrivCtrl', function($scope, $cookies){
    $scope.state = "Private";
});