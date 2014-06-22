app.controller('LandingCtrl', function($scope) {

});

app.controller('NavbarCtrl', function($scope, $rootScope, $firebase, $location) {
    var usersRef = $firebase(new Firebase("https://codetalking.firebaseio.com/users"));

    console.log("Enter NavbarCtrl, RootScope Auth: "+angular.toJson($rootScope.auth));

    $scope.submitAuth = function () {
        $rootScope.auth.$login('password', {
            email: $scope.emailAuth,
            password: $scope.passwordAuth
        }).then(function(user) {
            if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                $scope.$apply();
            }
            $scope.emailAuth = '';
            $scope.passwordAuth = '';
            $location.path('/start');
        }, function(error) {
            if (error.code == 'INVALID_USER') {
                console.log(error.message+" Trying to sign you up!");
                console.log("Stuff in RootScope before signup Attempt: "+angular.toJson($rootScope.auth));
                $rootScope.auth.$createUser($scope.emailAuth, $scope.passwordAuth, false)//False -> Log-in after sign up ; True -> Don't Login after signup
                    .then(function(user) {
                        console.log("Stuff in User: "+angular.toJson(user));
                        console.log("Stuff in rootScope: "+$rootScope.auth);
                        $rootScope.auth.user = user;
                        console.log("Stuff in rootScope User: "+$rootScope.auth.user);
                        //Add user to firebase and angular
                        //$scope.user = user; //Not sure if needed
                        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                            $scope.$apply();
                        }
                        usersRef.$add({
                            id: user.id,
                            email: user.email
                        });
                        console.log("Stuff in Auth: "+angular.toJson($rootScope.auth));
                        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                            $scope.$apply();
                        }
                        $scope.emailAuth = '';
                        $scope.passwordAuth = '';
                        $location.path('/start');
                    }, function(error) {
                        console.log("Error creating user: "+angular.toJson(error));
                })
            }
        })
    }

    $scope.logout = function () {
        $rootScope.auth.$logout();
        $rootScope.auth.user = null;
        console.log("Logout Auth: "+$rootScope.auth.user);
        $location.path('/');
    }
});

//Groups Page Controller
app.controller('GroupsCtrl', function($scope, $rootScope, $firebase) {
    var groupsRef = $firebase(new Firebase("https://codetalking.firebaseio.com/groups"))

    $scope.groups = groupsRef;

    $scope.groupsAlert = {
        alertType: "",
        message: "",
        isShown: false
    };

//    angular.forEach($scope.groups, function(value, key) {
//        console.log("Key: "+key+" Value: "+value);
//    });

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
        if ($scope.groups[$scope.newGroupName]) { //DUPLICATES: If true -> Name entered doesn't exist; If false -> Name already exists
            $scope.groups.$add({
                name: $scope.newGroupName,
                isPrivate: true //Set group.isPrivate to 'true'
            })
                .then(function (ref) { //Add Current user inside the newly created group
                    var groupRef = $firebase(new Firebase("https://codetalking.firebaseio.com/groups/" + ref.name() + "/rels/users"));
                    groupRef.$add({
                        id: $rootScope.auth.user.id,
                        email: $rootScope.auth.user.email
                    })
                });
        } else {
            console.log("Duplicate found with name: "+$scope.newGroupName);
            showAlert("alert-danger", "There is already a group named '"+$scope.newGroupName+"'.");
        }
        angular.element('#new-groupname-input').val('');
    }

});

app.controller('SingleGroupCtrl', function($scope, $routeParams, $firebase) {
   $scope.currentGroup = $routeParams.groupId;
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
