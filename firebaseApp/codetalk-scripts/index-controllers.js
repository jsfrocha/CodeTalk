/*
app.controller('FirebaseCtrl', function($scope, $firebase) {

    //Initialize Firebase Authentication
    var fire = new Firebase('https://codetalking.firebaseio.com');
    var fireAuth = new FirebaseSimpleLogin(fire, function(error, user) {
        if (error) {
            //Error during login
            console.log(error);
        } else if (user) {
            //User authenticated with Firebase
            console.log("User Var Log");
            console.log("User ID: " + user.uid + ", Provider: " + user.provider + ", Email: " + user.email);
            console.log("Auth Var Log");
            console.log("Email: " + fireAuth.email + ", ID: " + fireAuth.id + ", Provider: " + fireAuth.provider + ", UID: " + fireAuth.uid);
        }
        else {
            //user is logged out
        }
    });
    
    $scope.messages = $firebase(fire);
    $scope.addMessage = function(e) {
        if (e.keyCode != 13) return;
        $scope.messages.$add({from: $scope.name, body: $scope.msg});        
        $scope.msg = "";
    }
    
    $scope.removeMessage = function (id) {
        $scope.messages.$remove(id);        
    }
});
*/

app.controller('NavbarCtrl', function($scope, $rootScope) {

    console.log("Enter NavbarCtrl, RootScope Auth: "+angular.toJson($rootScope.auth));

    $scope.submitAuth = function () {
        $rootScope.auth.$login('password', {
            email: $scope.emailAuth,
            password: $scope.passwordAuth
        }).then(function(user) {
            console.log('User Logged In! User: '+angular.toJson(user));
            console.log("Stuff in Auth RootScope: "+angular.toJson($rootScope.auth));
            if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                $scope.$apply();
            }
        }, function(error) {
            if (error.code == 'INVALID_USER') {
                console.log(error.message+" Trying to sign you up!");
                console.log("Stuff in RootScope before signup Attempt: "+angular.toJson($rootScope.auth));
                $rootScope.auth.$createUser($scope.emailAuth, $scope.passwordAuth, false)//False -> Log-in after sign up ; True -> Don't Login after signup
                    .then(function(user) {
                        //Add user to firebase and angular
                        console.log("Stuff in Auth RootScope: "+angular.toJson($rootScope.auth));
                        $scope.user = user;
                        console.log("Stuff in User: "+angular.toJson($scope.user));
                        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                            $scope.$apply();
                        }
                    }, function(error) {
                        console.log("Error creating user: "+angular.toJson(error));
                })
            }
        })
    }
});

//Groups Page Controller
app.controller('GroupsCtrl', function($scope, $rootScope, $firebase) {

    $scope.groupsAlert = {
        alertType: "",
        message: "",
        isShown: false
    };

    function showAlert(alertType, message) {
        $scope.groupsAlert.message = message;
        $scope.groupsAlert.isShown = true;
        $scope.groupsAlert.alertType = alertType;
    }

    $scope.closeAlert = function () {
        $scope.groupsAlert.isShown = false;
    }


    $scope.createGroup = function () {
        //Create Firebase 'Group' in 'groups' with Name Entered
        //Add current user to group.rels.users
        //Set group.isPrivate to 'true'
    }

});

//Landing Controller
app.controller('LandingCtrl', function($scope, $cookies, $location, $cookieStore, $rootScope, userFactory) {
/*

	
    $scope.googleLogin = function() {
        fireAuth.login('google');
    };
    
	$scope.loginSubmit = function() {
		var user = $scope.login;
		userFactory.doLogin(user.name, user.pass)
		.success(function(data) {
			$cookies.sessionToken = data.sessionToken;
			$cookies.username = data.username;
     
            $scope.isLoggedIn = true;
            //alert(JSON.stringify(data)); Debug
			$('#loginUsername').val('');
			$('#loginPassword').val('');
            $('.getStartedModal').modal('hide');
            $('#nav-public').addClass('hide');
            $('#nav-private').removeClass('hide');
            $('.modal-backdrop').addClass('hide');
            $location.path('/home');
            $location.replace();
		})
		.error(function(data) {
			var error = data.error;
			var showError = error.charAt(0).toUpperCase() + error.slice(1);
            $('.alert-login')
                .empty()
			    .append('<p>'+showError+'</p>')
			    .show();
            $('#loginUsername').val('');
            $('#loginPassword').val('');                    
		}); 
	};

    $scope.registerSubmit = function() {
        var user = $scope.register;
        userFactory.doRegister(user.name, user.pass, user.email)
        .success(function(data) {
            var showSuccess = "You are now registered !"
            $('.alert-register-error')
                .empty()
                .hide();
            $('.alert-register-success')
                .empty()
                .append('<p>'+showSuccess+'</p>')
                .show();
            $('#registerEmail').val('');
            $('#registerUsername').val('');
            $('#registerPassword').val(''); 
        })
        .error(function(data) {
            var error = data.error;
            var showError = error.charAt(0).toUpperCase() + error.slice(1);
            $('.alert-register-success').empty().hide();
            $('.alert-register-error')
                .empty()
                .append('<p>'+showError+'</p>')
                .show();
            $('#registerEmail').val('');
            $('#registerUsername').val('');
            $('#registerPassword').val('');                    
        });
    }
    */
});

//Home Controller
app.controller('HomeCtrl', function($scope, parseObjFactory, userFactory) {
	$scope.hasCode = true;
    
    //Get ParseObj AceModes
    $scope.selectorLoader = true;
    parseObjFactory.getParseObj('AceModes')
    .success(function(data) {
        $scope.aceModes = data.results;
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

    //Set Editor Mode
    $scope.setMode = function () {
        var session = editor.getSession();
        var option = $scope.selectedMode;
        session.setMode("ace/mode/"+option);
    };

    //Save Note
    $scope.saveNote = function () {
        $scope.saveLoader = true;
        var newNote = {
            'noteTitle': $scope.newNote.title,
            'noteDescription': $scope.newNote.description
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
    
    //Delete Note
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
    
    //Add Code to Note
    $scope.addCode = function (note) {
        var code = {
            "title":"",
            "content":"",
            "mode":""
        };

        if (note == -1) { //New Note
            if ($('#inputTitle').val() == '') {
                $('#titleAlert').show();
                return 0;                
            } else {
                code.title = $scope.newNote.title;
                if ($scope.selectedMode == undefined || $scope.selectedMode == "") {
                    alert("Need to choose a Mode for the Code to Upload");
                    return 0;
                }
                else {
                    code.mode = $scope.selectedMode;
                }
            }
        } else {
            code.title = note.title;
            code.mode = note.noteMode;
        }

        if (editor.getSession().getValue().trim() == "") {
            alert("Need to add Code to Upload");
            return 0;
        }
        else {
            code.content = editor.getSession().getValue();    
        }
        

        //Upload Code to Parse
        parseObjFactory.uploadCode(code.content, code.title)
        .success(function(data) {
            console.log("SUCCESS - Upload Code FROM SCOPE\n"+angular.toJson(data));
            parseObjFactory.associateCode(data.name, code.mode, 'CodeChanges')
            .success(function(data) {
                console.log("SUCCESS - Associate Code FROM SCOPE\n"+angular.toJson(data));
            })
            .error(function(data) {
                console.log("ERROR - Associate Code FROM SCOPE\n"+angular.toJson(data));
            });

        })
        .error(function(data) {
            console.log("ERROR - UploadCode FROM SCOPE\n"+angular.toJson(data));
        });
    }

    //Testing Parse Relations
    $scope.setRelation = function () {
        parseObjFactory.setRelation('12objClass', '12objId', '12relColumn0', '12relChild', '12childId');
    }
    
});

app.controller('NavPubCtrl', function($scope) {
    $scope.state = "Public";
});