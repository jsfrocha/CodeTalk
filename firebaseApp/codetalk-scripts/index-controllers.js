app.controller('IndexCtrl', function($rootScope) {
    //Recycle Current User Groups (Delete /AllowedGroups that are no longer in /Groups

});

app.controller('LandingCtrl', function($scope) {

});

app.controller('NavbarCtrl', function($scope, $rootScope, $firebase, $location) {

    console.log("Enter NavbarCtrl, RootScope Auth: "+angular.toJson($rootScope.auth));

    var emailValidation = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;

    $scope.authLoader = false;

    $scope.signUpData = {
      email: '',
      password: ''
    };

    $scope.submitAuth = function () {
        if (!$scope.emailAuth.match(emailValidation)) {
            showAlert('alert-danger', 'Email is not valid');
        } else {
            $scope.authLoader = true;
            $rootScope.auth.$login('password', {
                email: $scope.emailAuth,
                password: $scope.passwordAuth
            }).then(function (user) {
                if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
                    $scope.$apply();
                }
                $scope.emailAuth = '';
                $scope.passwordAuth = '';
                $scope.authLoader = false;
                $location.path('/start');
            }, function (error) {
                if (error.code == 'INVALID_USER') {
                    showAlert('alert-danger', 'User does not exist');
                    $scope.emailAuth = '';
                    $scope.passwordAuth = '';
                    angular.element('#signInEmailId').val('');
                    angular.element('#signInPasswordId').val('');
                    $scope.authLoader = false;
                }
            })
        }
    }

    $scope.createUser = function() {

        $scope.authLoader = true;

        $rootScope.auth.$createUser($scope.signUpData.email, $scope.signUpData.password, true)//False -> Log-in after sign up ; True -> Don't Login after signup
            .then(function(user) {
               // $rootScope.auth.user = user;
                console.log('Create User. '+user.uid);
                var newUserRef = $rootScope.getFBRef('users/'+user.uid);
                //Add user to firebase and angular

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
                $scope.signUpData.email = '';
                $scope.signUpData.password = '';
                $scope.authLoader = false;

                angular.element('#signUpModal').modal('hide');
                $location.path('/start');

            }, function(error) {
                $scope.authLoader = false;
                showAlert('alert-danger', error.code);
                console.log("Error creating user: "+angular.toJson(error));
            })
    };

    $scope.logout = function () {
        $rootScope.auth.$logout();
        $rootScope.auth.user = null;
        console.log("Logout Auth: "+$rootScope.auth.user);
        $location.path('/');
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

//Groups Page Controller
app.controller('GroupsCtrl', function($scope, $rootScope) {

    var aceModesRef = $rootScope.getFBRef('aceModes');
    var currentUserGroupsRef = $rootScope.getFBRef('users/'+$rootScope.auth.user.uid+'/allowedGroups');
    var currentUserId = $rootScope.auth.user.uid;

    //Remove leftover modal backdrop
    angular.element('.modal-backdrop').remove();

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

        var currentUserGroupRef = $rootScope.getFBRef('users/' + $rootScope.auth.user.uid + '/allowedGroups');

        var newGroupName = $scope.newGroupName;
        var selectedMode = $scope.selectedMode;

        if (!!newGroupName) {
            if ($scope.selectedMode != "NONE") {
                if (isNameValid(newGroupName)) { //Happy Path
                    currentUserGroupRef.$add({
                        name: newGroupName,
                        mode: selectedMode,
                        createdBy: currentUserId
                    })
                        .then(function (ref) {
                            var groupRef = $rootScope.getFBRef('groups/' + newGroupName + '_' + currentUserId);
                            groupRef.$set({
                                mode: selectedMode,
                                isPrivate: true,
                                isCodeLocked: false,
                                code: '',
                                createdBy: currentUserId
                            });
                        }, function(err) {
                            if (err.code == "PERMISSION_DENIED") {
                                showAlert('alert-danger', 'You already created a group with that name.');
                                angular.element('#new-groupname-input').val('');
                            }
                        });
                    angular.element('#new-groupname-input').val('');
                }
                else { //Invalid Characters
                    showAlert('alert-danger', "Invalid characters, try: '" + suggestName(newGroupName) + "'");
                    angular.element('#new-groupname-input').val('');
                }
            }
            else { //No selected Mode
                showAlert('alert-danger', "A mode needs to be selected");
                angular.element('#new-groupname-input').val('');
            }
        }
        else { //Group name empty
            showAlert('alert-danger', "The group needs a name");
            angular.element('#new-groupname-input').val('');
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


    }//End createGroup()



});

app.controller('SingleGroupCtrl', function($scope, $rootScope, $routeParams) {

    $scope.codeLocked = true;

    $scope.currentGroup = $routeParams.groupName;
    var currentUserId = $rootScope.auth.user.uid;
    $scope.isUserAdmin = false;

    $scope.saveLoader = false;

    $scope.editor = ace.edit("code-editor");
    $scope.editor.setTheme("ace/theme/github");

    $scope.modalEditor = ace.edit("modal-code-editor");
    $scope.modalEditor.setTheme("ace/theme/github");
    $scope.modalEditor.setReadOnly(true);


    var groupsRef = $rootScope.getNormalFBRef('groups');
    groupsRef.once('value', function(snap) {
        snap.forEach(function(child) {
            console.log("child: "+child);
            if (child.name() == $scope.currentGroup + '_' + currentUserId) {
                //Found current group
                if (child.val().createdBy == currentUserId) $scope.isUserAdmin = true;

                $scope.groupMode = child.val().mode;
                $scope.editor.getSession().setMode("ace/mode/"+$scope.groupMode);
                $scope.modalEditor.getSession().setMode("ace/mode/"+$scope.groupMode);

                if (child.val().isCodeLocked == true) $scope.codeLocked = true;
                else $scope.codeLocked = false;

                if (child.val().code != '') {
                    $scope.editor.getSession().setValue(child.val().code);
                }
            }
        });
        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }


    });




    $scope.saveLockCode = function () {
        var code = $scope.editor.getSession().getValue();
        var currentGroup = $routeParams.groupName;
        var currentUserId = $rootScope.auth.user.uid;

        var currentGroupRef = $rootScope.getFBRef('groups/'+currentGroup+'_'+currentUserId);

        $scope.saveLoader = true;
        if (!!code) {
            $scope.editor.setReadOnly(true);

            currentGroupRef.$set({
               isCodeLocked: true,
               code: code
            });

            $scope.saveLoader = false;
        }
        else {
            $scope.saveLoader = false;
        }
    };

    $scope.unlockCode = function () {
        var currentGroup = $routeParams.groupName;
        var currentUserId = $rootScope.auth.user.uid;
        var currentGroupRef = $rootScope.getFBRef('groups/'+currentGroup+'_'+currentUserId);

        $scope.saveLoader = true;

        $scope.editor.setReadOnly(false);

        currentGroupRef.$set({
           isCodeLocked: false
        });

        $scope.saveLoader = false;

    };

    $scope.editor.on('blur', function() {
       $scope.modalEditor.getSession().setValue($scope.editor.session.getTextRange($scope.editor.getSelectionRange()));
    });



    $scope.groupsAlert = {
        alertType: "",
        message: "",
        isShown: false
    };

    $scope.showAlert = function(alertType, message) {
        $scope.groupsAlert.message = message;
        $scope.groupsAlert.isShown = true;
        $scope.groupsAlert.alertType = alertType;
    }

    $scope.closeAlert = function () {
        $scope.groupsAlert.isShown = false;
        $scope.groupsAlert.alertType = "";
        $scope.groupsAlert.message = "";

        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }
    }


});

app.controller('AddNoteCtrl', function($scope, $rootScope) {

    $scope.newNote = {};



    $scope.addNote = function () {
        console.log("addnote in");
        var currentUserId = $rootScope.auth.user.uid;
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

                var existingNotes = new Array();
                for (var i = 0; i < existingNotesArray.length; i++) {
                    if (existingNotesArray[i].split('_')[0] == $scope.currentGroup)
                        existingNotes.push(existingNotesArray[i].split('_')[1]);
                }

                if (existingNotes.indexOf(title) == -1) {
                    console.log("Set current Note - IN");
                    //Set Note in /Notes -> [GROUPNAME]_[NOTETITLE]
                    currentNoteRef.$set({
                        content: content,
                        code: code
                    });
                    console.log("Set current Note - OUT");
                    var groupNotesRef = $rootScope.getFBRef('groups/'+$scope.currentGroup + '_' + currentUserId+'/notes');
                    console.log("Set group Note - IN");
                    //Add Note to Groups/Notes
                    groupNotesRef.$add({
                        title: title,
                        content: content,
                        code: code
                    });
                    console.log("Set group note - OUT");

                    $scope.newNote.noteTitle = "";
                    $scope.newNote.noteContent = "";
                    $scope.modalEditor.getSession().setValue('');
                    angular.element('#addNoteModal').modal('hide');
                }
                else {
                    $scope.showAlert('alert-danger', 'Note "'+title+'" already exists in this group');
                }
            });
            console.log("Note\n");
            console.log("Title: "+title+"\n");
            console.log("Content: "+content+"\n");
            console.log("Code: "+code+"\n");


        }
        else {
           $scope.showAlert('alert-danger', 'Both fields are mandatory');
        }
    };

});

app.controller('DeleteGroupCtrl', function($scope, $rootScope, $location) {

    $scope.deleteGroup = function () {
        var groupNameConfirmation = $scope.deleteGroupConfirm;

        var currentGroup = $scope.currentGroup;
        var currentUser = $rootScope.auth.user.uid;

        console.log(groupNameConfirmation);
        console.log(currentGroup);

        if (groupNameConfirmation == currentGroup) {
            var groupsRef = $rootScope.getFBRef('users/'+currentUser+'/allowedGroups');

            //Delete from /AllowedGroups
            var keys = groupsRef.$getIndex();

            keys.forEach(function(key, i) {
               if (groupsRef[key].name == currentGroup) {
                   groupsRef.$remove(key);
               }
            });

            angular.element('#deleteGroupModal').modal('hide');

            $location.path('/start');
        }
        else {
            $scope.showAlert('alert-danger', 'The group name inserted does not match the current group!');
        }

    };
});

app.controller('ViewNoteCtrl', function($scope) {

});


app.controller('InviteFriendsCtrl', function($scope, $rootScope, $routeParams) {

});