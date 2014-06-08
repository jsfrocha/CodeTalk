var app = angular.module('indexApp', ['ngRoute', 'ngCookies', 'firebase']);

app.config(function($routeProvider, $locationProvider) {
    

	$routeProvider

	 .when('/', {
	 	templateUrl: 'codetalk-views/public/landing.html',
	 	controller: 'LandingCtrl'
	 })
    
    .when('/logout', {
        templateUrl: 'codetalk-views/public/landing.html',
        controller: 'LandingCtrl'
    })
    
	.when('/contact', {
		templateUrl: 'codetalk-views/public/contact.html',
		controller: 'ContactCtrl'
	})

    .when('/about', {
        templateUrl: 'codetalk-views/public/about.html',
        controller: 'AboutCtrl'
    })
    .when('/home', {
        templateUrl: 'codetalk-views/private/home.html',
        controller: 'HomeCtrl'
    })
    .when('/start', {
        templateUrl: 'codetalk-views/private/start.html',
        controller: 'StartCtrl'
    })
    .when('/firebase', {
        templateUrl: 'codetalk-views/private/firebase.html',
        controller: 'FirebaseCtrl'
    })
	.otherwise( {
		redirectTo: '/notfound',
        templateUrl: 'codetalk-views/notfound.html'
	}); 
}).

run(function($rootScope, $location, $cookies) {
    //Register Listener to watch route changes
    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        if ($cookies.sessionToken == null || $cookies.sessionToken == undefined) {
            //No Logged in user, we should go to Login page
            if (next.templateUrl == "codetalk-views/public/landing.html" ||
                next.templateUrl == "codetalk-views/public/about.html" ||
                next.templateUrl == "codetalk-views/public/contact.html" ||
                next.templateUrl == "codetalk-views/private/firebase.html") {
                //Already going to landing, no redirect needed
            } else {
                //Not going to landing, needs to redirect
                $location.path("/");
            }
        }
        else {
            /*
            if (next.templateUrl == "codetalk-views/public/landing.html" && $cookies.sessionToken != null) {
                $location.path('/home');
            }
            */
        }

    });
    

});