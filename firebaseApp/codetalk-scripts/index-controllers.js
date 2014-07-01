app.controller('LandingCtrl', function($scope) {

});

app.controller('NavbarCtrl', function($scope, $rootScope, $firebase, $location) {

    console.log("Enter NavbarCtrl, RootScope Auth: "+angular.toJson($rootScope.auth));

    $scope.authLoader = false;

    $scope.submitAuth = function () {
        $scope.authLoader = true;
        $rootScope.auth.$login('password', {
            email: $scope.emailAuth,
            password: $scope.passwordAuth,
            debug: true //TODO: Remove this (debug only)
        }).then(function(user) {
            if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                $scope.$apply();
            }
            $scope.emailAuth = '';
            $scope.passwordAuth = '';
            $scope.authLoader = false;
            $location.path('/start');
        }, function(error) {
            if (error.code == 'INVALID_USER') {
                console.log(error.message+" Trying to sign you up!");
                $rootScope.auth.$createUser($scope.emailAuth, $scope.passwordAuth, false)//False -> Log-in after sign up ; True -> Don't Login after signup
                    .then(function(user) {
                        $rootScope.auth.user = user;
                        var newUserRef = $rootScope.getFBRef('users/'+$rootScope.auth.user.uid);
                        //Add user to firebase and angular
                        //$scope.user = user; //Not sure if needed
                        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                            $scope.$apply();
                        }
                        newUserRef.$set({
                            id: user.id,
                            email: user.email,
                            provider: user.provider
                        });
                        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                            $scope.$apply();
                        }
                        $scope.authLoader = false;
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

    var aceModesRef = $rootScope.getFBRef('aceModes');

    var currentUserGroupsRef = $rootScope.getFBRef('users/'+$rootScope.auth.user.uid+'/allowedGroups');

    $scope.groups = currentUserGroupsRef;

    $scope.selectedMode = "NONE";

    $scope.aceModes = aceModesRef;

    $scope.testFunction = function () {
        console.log("Test Function - IN");
        $scope.groupsRef = $rootScope.getFBRef('groups');
        $scope.groupsRef.$on('loaded', function () {
            var existingGroups = $scope.groupsRef.$getIndex();
            var newGroupName = $scope.newGroupName;
            existingGroups.forEach(function(key, i) {
                if (existingGroups[i] == newGroupName) {
                    showAlert('alert-danger', 'Group name already exists');
                    return false;
                }
            });
        });


        console.log("Test Function - OUT");
    }


    $scope.createGroup = function () {

        var currentUserGroupRef = $rootScope.getFBRef('users/'+$rootScope.auth.user.uid+'/allowedGroups');
        var groupsRef = $rootScope.getFBRef('groups');

        var existingGroups = groupsRef.$getIndex();

        var newGroupName = $scope.newGroupName;
        var selectedMode = $scope.selectedMode;

        //TODO: Check for duplicate group names needs to be done on .write / .validate rules
//        groupsRef.$on('loaded', function() {
//           var existingGroups = groupsRef.$getIndex();
//           existingGroups.forEach(function(key, i) {
//              if (existingGroups[i] == newGroupName) {
//                  showAlert('alert-danger', 'Group name already exists');
//                  return false;
//              }
//           });
//        });


            //Add
            if (!!$scope.newGroupName) {
                if ($scope.selectedMode != "NONE") { //Happy path
                    currentUserGroupRef.$add({
                        name: newGroupName,
                        mode: selectedMode
                    })
                        .then(function(ref) {
                            var groupRef = $rootScope.getFBRef('groups/'+$scope.newGroupName);
                            groupRef.$set({
                                mode: selectedMode,
                                isPrivate: true
                            });
                        });
                    angular.element('#new-groupname-input').val('');
                }
                else { //No Selected Mode
                    showAlert('alert-danger', 'Please select a mode for the group');
                }
            }
            else { //New Group Name is Empty
                showAlert('alert-danger', 'Please insert a name for the group');
            }





//        //Create Firebase 'Group' in 'groups' with Name Entered
//        if (!$scope.groups[$scope.newGroupName]) { //DUPLICATES: If true -> Name entered doesn't exist; If false -> Name already exists
//            $scope.groups.$add({
//                name: $scope.newGroupName,
//                isPrivate: true //Set group.isPrivate to 'true'
//            })
//                .then(function (ref) { //Add Current user inside the newly created group
//                    var groupRef = $firebase(new Firebase("https://codetalking.firebaseio.com/groups/" + ref.name() + "/rels/users/"+$rootScope.auth.user.uid));
//                    groupRef.$add({
//                        id: $rootScope.auth.user.id,
//                        email: $rootScope.auth.user.email
//                    });
//                });
//        } else {
//            console.log("Duplicate found with name: "+$scope.newGroupName);
//            showAlert("alert-danger", "There is already a group named '"+$scope.newGroupName+"'.");
//        }

    }



    //When GROUPS are loaded, add those that belong to user OR are public to USERGROUPS, and display that.
    //TODO: $on 'loaded' only triggers once, it does not trigger with new data input
//    $scope.groups.$on('loaded', function() {
//        $scope.groups.$getIndex().forEach(function(value, key) {
//            if ($scope.groups[value].rels.users[$rootScope.auth.user.uid] || !$scope.groups[value].isPrivate) {
//                $scope.userGroups.push($scope.groups[value]);
//            }
//        });
//    });
//
//    $scope.groups.$on('child_added', function() {
//        $scope.groups.$getIndex().forEach(function(value, key) {
//            if ($scope.groups[value].rels.users[$rootScope.auth.user.uid] || !$scope.groups[value].isPrivate) {
//                $scope.userGroups.push($scope.groups[value]);
//            }
//        });
//    });


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
