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

    $scope.createGroup = function () {
        var suggestName = function (name) {
            return name.replace(/[^a-z0-9]/gi, '');
        };
        var isNameValid = function (name) {
            var regex = /[^a-z0-9]/ig;
            if (name.match(regex)) return false;
            else return true;
        }

        var currentUserGroupRef = $rootScope.getFBRef('users/'+$rootScope.auth.user.uid+'/allowedGroups');
        var newGroupName = $scope.newGroupName;
        var selectedMode = $scope.selectedMode;

        //Add
        if (!!$scope.newGroupName) {
            if ($scope.selectedMode != "NONE") { //Happy path
                if (isNameValid($scope.newGroupName)) {
                    currentUserGroupRef.$add({
                        name: newGroupName,
                        mode: selectedMode
                    })
                        .then(function (ref) {
                            var groupRef = $rootScope.getFBRef('groups/' + $scope.newGroupName);
                            groupRef.$set({
                                mode: selectedMode,
                                isPrivate: true
                            });
                        });
                    angular.element('#new-groupname-input').val('');
                }
                else {//Invalid Characters
                    showAlert('alert-danger', "Invalid characters, try: '"+suggestName($scope.newGroupName)+"'");
                }
            }
            else { //No Selected Mode
                showAlert('alert-danger', 'Please select a mode for the group');
            }
        }
        else { //New Group Name is Empty
            showAlert('alert-danger', 'Please insert a name for the group');
        }
    }

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
        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }
    }
});

app.controller('SingleGroupCtrl', function($scope, $rootScope, $routeParams, $firebase) {
    $scope.currentGroup = $routeParams.groupName;

    $scope.editor = ace.edit("code-editor");
    $scope.editor.setTheme("ace/theme/github");

    $scope.modalEditor = ace.edit("modal-code-editor");
    $scope.modalEditor.setTheme("ace/theme/github");
    $scope.modalEditor.setReadOnly(true);


    var groupsRef = $rootScope.getNormalFBRef('groups');
    groupsRef.once('value', function(snap) {
        snap.forEach(function(child) {
            if (child.name() == $scope.currentGroup) {
                $scope.groupMode = child.val().mode;
                $scope.editor.getSession().setMode("ace/mode/"+$scope.groupMode);
                $scope.modalEditor.getSession().setMode("ace/mode/"+$scope.groupMode);
            }
        });
    });

    $scope.notes = $rootScope.getFBRef('notes');

    $scope.editor.on('blur', function() {
       $scope.modalEditor.getSession().setValue($scope.editor.session.getTextRange($scope.editor.getSelectionRange()));
    });
});

app.controller('AddNoteCtrl', function($scope, $rootScope) {

    $scope.newNote = {};



    $scope.addNote = function () {
        console.log("addnote in");

        $scope.modalEditor.setValue($scope.codeContent);

        if (typeof $scope.newNote != undefined && $scope.newNote.noteTitle && $scope.newNote.noteContent) {

            var title = $scope.newNote.noteTitle;
            var content = $scope.newNote.noteContent;
            var code = $scope.editor.session.getTextRange($scope.editor.getSelectionRange());

            var currentNoteRef = $rootScope.getFBRef('notes/'+$scope.currentGroup+'_'+title);
            var notesRef = $rootScope.getNormalFBRef('notes');

            var existingNotesArray = new Array();

            notesRef.once('value', function(snap) {
                snap.forEach(function(child) {
                    existingNotesArray.push(child.name());
                });
            });
            var existingNotes = new Array();
            for (var i = 0; i < existingNotesArray.length; i++) {
                if (existingNotesArray[i].split('_')[0] == $scope.currentGroup)
                    existingNotes.push(existingNotesArray[i].split('_')[1]);
            }

            if (existingNotes.indexOf(title) == -1) {
                currentNoteRef.$set({
                    content: content,
                    code: code
                });

                $scope.newNote.noteTitle = "";
                $scope.newNote.noteContent = "";
                $scope.modalEditor.getSession().setValue('');
                angular.element('#addNoteModal').modal('hide');
            }
            else {
                showAlert('alert-danger', 'Note "'+title+'" already exists in this group');
            }

            console.log("Note\n");
            console.log("Title: "+title+"\n");
            console.log("Content: "+content+"\n");
            console.log("Code: "+code+"\n");


        }
        else {
            showAlert('alert-danger', 'Both fields are mandatory');
        }
    };

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
        $scope.groupsAlert = {
            alertType: "",
            message: "",
            isShown: false
        };
        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }
    }
});

app.controller('ViewNoteCtrl', function($scope) {

});


app.controller('InviteFriendsCtrl', function($scope, $rootScope, $routeParams) {

});