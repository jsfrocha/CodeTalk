app.directive('navpublic', function(){
    // Runs during compile
    return {
        scope: true,
        restrict: 'A',
        templateUrl: 'codetalk-views/public/nav.html',
        link: function(scope, element, attrs) {
            
        }                
    };
});



app.directive('navprivate', function(){
    // Runs during compile
    return {
        scope: true,
        restrict: 'A',
        templateUrl: 'codetalk-views/private/nav.html',
        link: function(scope, element, attrs) {
            
        }
    };
});

