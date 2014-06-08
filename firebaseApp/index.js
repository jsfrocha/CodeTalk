/*var app = angular.module('indexApp', ['ngRoute', 'ngCookies']);

    	app.config(function($routeProvider, $locationProvider) {
            

    		$routeProvider

    		 .when('/', {
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
                        next.templateUrl == "codetalk-views/public/contact.html") {
                        //Already going to landing, no redirect needed
                    } else {
                        //Not going to landing, needs to redirect
                        $location.path("/");
                    }
                }
                else {
                    if (next.templateUrl == "codetalk-views/public/landing.html") {
                        $location.path('/home');
                    }
                }

            }
            )
        });

    	app.controller('NavbarCtrl', function($scope, $cookies, $location) {
    		if ($cookies.sessionToken == null) {
    			$scope.isLoggedIn = false;
    		}
    		else {
    			$scope.isLoggedIn = true;
    			$scope.loggedInUser = $cookies.username;
                $('#nav-public').addClass('hide');
                $('#nav-private').removeClass('hide');                
    		}

    		$scope.logout = function () {
    			if ($scope.isLoggedIn == true) {
    				$cookies.username = undefined;
    				$cookies.sessionToken = undefined;
    				$scope.loggedInUser = undefined;
    				$scope.isLoggedIn = false;
                    $('#nav-private').addClass('hide');
                    $('#nav-public').removeClass('hide');
                    $location.path('/');    				
	   			}
    			else {
    				alert('There is no user logged in');
    			}
    		}
    	});
    	//Landing Controller
    	app.controller('LandingCtrl', function($scope, $cookies, $location, userFactory) {
    		
    		$scope.loginSubmit = function() {
    			var user = $scope.login;
				userFactory.doLogin(user.name, user.pass)
				.success(function(data) {
					$cookies.sessionToken = data.sessionToken;

					$cookies.username = data.username;
					$scope.isLoggedIn = true;
					alert(JSON.stringify(data));
					alert(typeof $scope.isLoggedIn + ' ' + $scope.isLoggedIn);
					$('#loginUsername').val('');
					$('#loginPassword').val('');
                    $('.getStartedModal').modal('hide');
                    $('#nav-public').addClass('hide');
                    $('#nav-private').removeClass('hide');
                    $('.modal-backdrop').addClass('hide');
                    $location.path('/home');

				})
				.error(function(data) {
					var error = data.error;
					var showError = error.charAt(0).toUpperCase() + error.slice(1);
                    $('.alert-login').empty();
					$('.alert-login').append('<p>'+showError+'</p>');
					$('.alert-login').show();
                    $('#loginUsername').val('');
                    $('#loginPassword').val('');                    
				}); 
    		};

            $scope.registerSubmit = function() {
                var user = $scope.register;
                userFactory.doRegister(user.name, user.pass, user.email)
                .success(function(data) {
                    var showSuccess = "You are now registered !"
                    $('.alert-register-error').empty();
                    $('.alert-register-error').hide();
                    $('.alert-register-success').empty();
                    $('.alert-register-success').append('<p>'+showSuccess+'</p>');
                    $('.alert-register-success').show();
                    $('#registerEmail').val('');
                    $('#registerUsername').val('');
                    $('#registerPassword').val(''); 
                })
                .error(function(data) {
                    var error = data.error;
                    var showError = error.charAt(0).toUpperCase() + error.slice(1);
                    $('.alert-register-success').empty();
                    $('.alert-register-success').hide();
                    $('.alert-register-error').empty();
                    $('.alert-register-error').append('<p>'+showError+'</p>');
                    $('.alert-register-error').show();
                    $('#registerEmail').val('');
                    $('#registerUsername').val('');
                    $('#registerPassword').val('');                    
                });
            }
    	});

    	//Home Controller
    	app.controller('HomeCtrl', function($scope, parseObjFactory, userFactory) {
    		$scope.hasCode = true;

            //Get ParseObj AceModes
            $scope.selectorLoader = true;
            parseObjFactory.getParseObj('AceModes')
            .success(function(data) {
                $scope.aceModes = data.results;
                console.log($scope.aceModes[0]);
                $scope.selectorLoader = false;
            })
            .error(function(data) {
                console.log('Error Data: '+data);
                $scope.selectorLoader = false;
            });

            //Get Current Notes
            $scope.noteLoader = true;
            parseObjFactory.getParseObj('CodeNotes')
            .success(function(data) {
                $scope.notes = data.results;
                $scope.noteLoader = false;

            })
            .error(function(data) {
                console.log('Error Data: '+data);
                $scope.noteLoader = false;
            });

            $scope.setMode = function () {
                var session = editor.getSession();
                var option = $scope.selectedMode;
                session.setMode("ace/mode/"+option);
            };

            $scope.saveNote = function () {
                $scope.saveLoader = true;
                var newNote = {
                    noteTitle: $scope.newNote.title,
                    noteDescription: $scope.newNote.description
                };

                if ($('#inputTitle').val() == '') {
                    $('#titleAlert').show();
                    $scope.saveLoader = false;
                }
                else {
                    parseObjFactory.createNote('CodeNotes', newNote)
                    .success(function(data) {
                        $scope.saveLoader = false;
                        $('#inputTitle').val('');
                        $('#inputDescription').val('');
                        $('#titleAlert').hide();
                        //Reload Notes
                        parseObjFactory.getParseObj('CodeNotes')
                        .success(function(data) {
                            $scope.notes = data.results;
                        })
                        .error(function(data) {
                            $('#inputTitle').val('Error');
                            $('#inputDescription').val(angular.toJson(data));                        
                            console.log('Error Data: '+data);
                        });
                    })
                    .error(function(data) {
                        $scope.saveLoader = false;
                        console.log('Error Data: '+data);
                    });
                }
            };

            $scope.deleteNote = function (note) {
                $scope.deleteLoader = true;
                var noteId = note.objectId;
                parseObjFactory.deleteNote('CodeNotes', noteId)
                .success(function(data) {
                    //Reload Notes
                    parseObjFactory.getParseObj('CodeNotes')
                    .success(function(data) {
                        $scope.notes = data.results;
                        $scope.deleteLoader = false;
                    })
                    .error(function(data) {
                        $('#inputTitle').val('Error');
                        $('#inputDescription').val(angular.toJson(data));                        
                        console.log('Error Data: '+data);
                        $scope.deleteLoader = false;
                    });                    
                })
                .error(function(data) {
                    console.log('Error Data: '+data);
                    $scope.deleteLoader = false;
                });
            };
            
    	});


                                        



        //Start Page Controller
        app.controller('StartCtrl', function($scope) {
            
        });

        app.controller('ContactCtrl', function($scope) {

        });


        //User Access Factory
        app.factory('userFactory', function($http, $cookies) {
            var factory = {};

            var loginData = {
                url: 'https://api.parse.com/1/login',
                method: 'GET'
            };

            var registerData = {
                url: 'https://api.parse.com/1/users',
                method: 'POST'
            };

            var currentUserData = {
                url: 'https://api.parse.com/1/users/me',
                method: 'GET',
                headers: {
                    'X-Parse-Application-Id':'LJMF3VG9jF5VXW92SCMIMtxKBcHc3ClfMN7FE2Mf',
                    'X-Parse-REST-API-Key':'VXBG3rPRfwyAPsM8ftKPdyqWTX6T5CSyErYKRVY1',
                    'X-Parse-Session-Token':$cookies.sessionToken                   
                }
            };

            var headerData = {
                'X-Parse-Application-Id':'LJMF3VG9jF5VXW92SCMIMtxKBcHc3ClfMN7FE2Mf',
                'X-Parse-REST-API-Key':'VXBG3rPRfwyAPsM8ftKPdyqWTX6T5CSyErYKRVY1'
            };

            //Login Factory
            factory.doLogin = function(username, password) {
                var paramData = {
                    'username':username,
                    'password':password
                };
                return $http({
                    method: loginData.method,
                    url: loginData.url,
                    headers: headerData,
                    params: paramData
                });
            }

            //Register Factory
            factory.doRegister = function(username, password, email) {
                var userData = {
                    'username':username,
                    'password':password,
                    'email':email
                };
                return $http({
                    method: registerData.method,
                    url: registerData.url,
                    headers: headerData,
                    data: userData
                });
            }

            factory.getCurrentUser = function() {
                return $http({
                    method: currentUserData.method,
                    url: currentUserData.url,
                    headers: currentUserData.headers
                });
            }

            return factory;
        })
        
        //ParseObj Factory
        app.factory('parseObjFactory', function($http, $cookies, userFactory) {
            var acl = {};
            userFactory.getCurrentUser()
            .success(function(data) {
                acl[data.objectId] = {
                    'read':true,
                    'write':true
                };
            })
            .error(function(data) {
                console.log('Cannot get user: '+angular.toJson(data));
            });

            var factory = {};
            var baseUrl = 'https://api.parse.com/1/classes/';
            var headers = {
                'X-Parse-Application-Id':'LJMF3VG9jF5VXW92SCMIMtxKBcHc3ClfMN7FE2Mf',
                'X-Parse-REST-API-Key':'VXBG3rPRfwyAPsM8ftKPdyqWTX6T5CSyErYKRVY1',
                'X-Parse-Session-Token':$cookies.sessionToken
            };

            
            factory.getParseObj = function (objClass) {
                return $http({
                    method: 'GET',
                    url: baseUrl + objClass,
                    headers: headers                    
                });
            };

            factory.createNote = function (objClass, content) {
                content.ACL = acl;
                return $http({
                    method: 'POST',
                    url: baseUrl + objClass,
                    headers: headers,
                    data: content
                });
            };

            factory.deleteNote = function (objClass, objId) {
                return $http({
                    method: 'DELETE',
                    url: baseUrl + objClass + '/' + objId,
                    headers: headers
                });
            };
            return factory;
        });

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



*/