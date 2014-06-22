/*
 Angular App Setup
  - Initialization
  - Routing
 */
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
            templateUrl: 'codetalk-views/private/groupitem.html',
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

/*
Controllers
 */

/*
Authentication Controller
 */
app.controller('AuthCtrl', function($scope, $rootScope, $firebaseAuth) {
    var ref = new Firebase('https://codetalking.firebaseio.com/');
    $rootScope.auth = $firebaseAuth(ref);

    $scope.signIn = function() {
        $rootScope.auth.$login('password', {
            email: $scope.login.email,
            password: $scope.login.password
        }).then(function(user) {
            $rootScope.alert.message = '';
        }, function(error) {
            if (error == 'INVALID_EMAIL') {
                console.log('Invalid email or not signed up');
            } else if (error == 'INVALID_PASSWORD') {
                console.log("Wrong password");
            } else {
                console.log(error);
            }
        });
    }

    $scope.signUp = function() {
        $rootScope.auth.$createUser($scope.register.email, $scope.register.password, function(error, user) {
            if (!error) {
                $rootScope.alert.message = '';
            }
            else {
                $rootScope.alert.class = 'danger';
                $rootScope.alert.message = 'The username and password combination you entered is invalid';
            }
        });
    }

});

/*
Navbar Controller
 */

app.controller('NavbarCtrl', function($scope, $rootScope, $location, $firebaseAuth) {


});

/*
Landing Page Controller
 */

app.controller('LandingCtrl', function ($scope, $rootScope) {

})

/*
Directives
 */

/*
Navbar Directives + Controllers
 */

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

app.controller('NavPubCtrl', function($scope, $rootScope) {
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

app.controller('NavPrivCtrl', function($scope, $rootScope){
    $scope.state = "Private";
});



