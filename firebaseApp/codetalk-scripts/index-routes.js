'use strict';

var app = angular.module('indexApp', ['ngRoute', 'ngCookies', 'firebase']);

app.config(function($routeProvider) {

  	$routeProvider

	 .when('/', {
	 	templateUrl: 'codetalk-views/public/landing.html',
	 	controller: 'LandingCtrl'
	 })

    .when('/home', {
        templateUrl: 'codetalk-views/private/groupitem.html',
        controller: 'HomeCtrl'
    })
    .when('/start', {
        templateUrl: 'codetalk-views/private/groups.html',
        controller: 'GroupsCtrl'
    })

    .when('/start/:groupName', {
        templateUrl: 'codetalk-views/private/groupitem.html',
        controller: 'SingleGroupCtrl'
    })

	.otherwise( {
		redirectTo: '/notfound',
        templateUrl: 'codetalk-views/notfound.html'
	});

    //Initialize Firebase Auth

}).

run(function($rootScope, $location, $firebaseSimpleLogin, $firebase) {
    var dataRef = new Firebase('https://codetalking.firebaseio.com');
    $rootScope.auth = $firebaseSimpleLogin(dataRef);

    //Get current user
    $rootScope.auth.$getCurrentUser().then(function(user) {
        if (user) {
            $location.path('/start');
        }
        else {
            $location.path('/');
        }
    }, function(error) {
        console.log(error);
    });

    //Register Listener to watch route changes
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        console.log("RouteChangeStart");
        console.log("AuthUser: "+angular.toJson($rootScope.auth.user));
        if ($rootScope.auth.user == null || $rootScope.auth.user == undefined) {
            //No Logged in user, we should go to Login page
            if (next.templateUrl == "codetalk-views/public/landing.html"
            /*next.templateUrl == "codetalk-views/private/groups.html"*/) {
                //Already going to landing, no redirect needed
            } else {
                //Not going to landing, needs to redirect
                $location.path("/");
            }
        }
        else {
            if (current.templateUrl == "codetalk-views/private/groups.html") {

            } else {
                $location.path('/start');
            }


        }

    });

    $rootScope.getFBRef = function (urlAdded) {
        return $firebase(new Firebase('https://codetalking.firebaseio.com/'+urlAdded));
    }

    $rootScope.getNormalFBRef = function (urlAdded) {
        return new Firebase('https://codetalking.firebaseio.com/'+urlAdded);
    }

    $rootScope.setupFileDragAndDrop = function (editorDiv, editor) {
        debugger;
        console.log("FileDAD - IN");
        addFileDragAndDropEventListeners(editorDiv, editor);

        function addFileDragAndDropEventListeners (editorDiv, aceObject) {
            console.log("AddEvent1");
            editorDiv.addEventListener('dragover', function(e) {
               stopEvent(e);
            });
            console.log("AddEvent2");
            editorDiv.addEventListener('drop', function(e) {
               putFileContentsInAceEditor(e.dataTransfer.files[0], aceObject);
               stopEvent(e);
            });

            function putFileContentsInAceEditor(file, aceEditor) {
                console.log("PutFileContents");
                var reader, text;
                reader = new FileReader();
                reader.onload = (function (file) {
                   text = file.target.result;
                   aceEditor.getSession().setValue(text);
                });
                reader.readAsText(file);
            }

            function stopEvent(e) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
        console.log("FileDAD - OUT");
    }

    

});