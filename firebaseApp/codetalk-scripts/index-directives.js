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

app.directive('ace', ['$timeout', function($timeout) {

    var resizeEditor = function (editor, elem) {
        var lineHeight = editor.renderer.lineHeight;
        var rows = editor.getSession().getLength();

        $(elem).height(rows * lineHeight);

        editor.resize();
    }

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attr, ngModel) {
            var node = elem[0];

            var editor = scope.editor;

            //data binding to ngModel
            ngModel.$render = function() {
                editor.setValue(ngModel.$viewValue);
                resizeEditor(editor, elem);
            };

            editor.on('change', function() {
                $timeout(function() {
                    scope.$apply(function() {
                        var value = editor.getValue();
                        ngModel.$setViewValue(value);
                    });
                });
                resizeEditor(editor, elem);
            });
        }
    };


}]);

