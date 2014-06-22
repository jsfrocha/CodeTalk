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

    .when('/start/:groupId', {
        templateUrl: 'codetalk-views/private/groupitem.html',
        controller: 'SingleGroupCtrl'
    })

	.otherwise( {
		redirectTo: '/notfound',
        templateUrl: 'codetalk-views/notfound.html'
	});

    //Initialize Firebase Auth

}).

run(function($rootScope, $location, $firebaseSimpleLogin) {
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
        console.log("AuthUser: "+$rootScope.auth.user);
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
            console.log("User Authenticated: "+$rootScope.auth.user.email);
            $location.path('/start');
        }

    });



    

});