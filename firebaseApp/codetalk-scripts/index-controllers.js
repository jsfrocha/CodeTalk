app.controller('IndexCtrl', function($rootScope) { });

app.controller('LandingCtrl', function($scope) { });

app.controller('NavbarCtrl', function($scope, $rootScope, $firebase, $location) {

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
                var message;
                if (error) {
                    switch (error.code) {
                        case "INVALID_PASSWORD": message = 'The specified password is invalid.'; break;
                        case "INVALID_USER": message = 'The specified user does not exist.'; break;
                        case "INVALID_EMAIL": message = 'The specified e-mail is invalid.'; break;
                        default: message = 'An unknown error occurred in the log-in process.'; console.log(angular.toJson(error)); break;

                    }
                    showAlert('alert-danger', message);
                    $scope.emailAuth = '';
                    $scope.passwordAuth = '';
                    angular.element('#signInEmailId').val('');
                    angular.element('#signInPasswordId').val('');
                    $scope.authLoader = false;
                }
                else {
                    $scope.authLoader = false;
                }
            })
        }
    }

    $scope.createUser = function() {

        $scope.authLoader = true;

        $rootScope.auth.$createUser($scope.signUpData.email, $scope.signUpData.password, true)//False -> Log-in after sign up ; True -> Don't Login after signup
            .then(function(user) {
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
    var overallGroups = $rootScope.getFBRef('groups');
    var currentUserId = $rootScope.auth.user.uid;

    //Remove leftover modal backdrop
    angular.element('.modal-backdrop').remove();

    $scope.overallGroups = overallGroups;
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

        $scope.groupsAlert = {
            alertType: "",
            message: "",
            isShown: false
        };

        var currentUserGroupRef = $rootScope.getFBRef('users/' + $rootScope.auth.user.uid + '/allowedGroups');

        var newGroupName = $scope.newGroupName;
        var selectedMode = $scope.selectedMode;

        var fullGroupName = newGroupName + '_' + currentUserId;

        if (!!newGroupName) {
            if ($scope.selectedMode != "NONE") {
                if (isNameValid(newGroupName)) { //Happy Path
                    currentUserGroupRef.$add({
                        name: newGroupName,
                        mode: selectedMode,
                        createdBy: currentUserId,
                        fullName: fullGroupName,
                        isPrivate: true
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

    $scope.currentGroupFull = $routeParams.groupName;
    $scope.currentGroup = $routeParams.groupName.split("_")[0];
    $scope.isUserAdmin = false;
    $scope.saveLoader = false;

    $scope.viewArchived = false;

    $scope.notes = $rootScope.getFBRef('groups/'+$scope.currentGroupFull+'/notes');

    $scope.hasNotes = function () { return !angular.equals({}, $scope.notes); }

    var currentUserId = $rootScope.auth.user.uid;

    $scope.editor = ace.edit("code-editor");
    $scope.editor.setTheme("ace/theme/github");

    $scope.modalEditor = ace.edit("modal-code-editor");
    $scope.modalEditor.setTheme("ace/theme/github");

    $scope.viewModalEditor = ace.edit("view-modal-code-editor");
    $scope.viewModalEditor.setTheme("ace/theme/github");
    $scope.viewModalEditor.setReadOnly(true);

    var editorDiv = document.getElementById('code-editor');
    var modalEditorDiv = document.getElementById('modal-code-editor');

    $rootScope.setupFileDragAndDrop(editorDiv, $scope.editor);
    $rootScope.setupFileDragAndDrop(modalEditorDiv, $scope.modalEditor);

    var groupsRef = $rootScope.getNormalFBRef('groups');
    groupsRef.once('value', function(snap) {
        snap.forEach(function(child) {
               if (child.name() == $scope.currentGroupFull) {
                //Found current group
                if (child.val().createdBy == currentUserId) $scope.isUserAdmin = true;

                $scope.groupMode = child.val().mode;
                $scope.editor.getSession().setMode("ace/mode/"+$scope.groupMode);
                $scope.modalEditor.getSession().setMode("ace/mode/"+$scope.groupMode);
                $scope.viewModalEditor.getSession().setMode("ace/mode/"+$scope.groupMode);

//                $scope.editorBinding = $rootScope.getFBRef('groups/'+$scope.currentGroupFull);
//                $scope.codeBinding = $rootScope.getFBRef('groups/'+$scope.currentGroupFull+'/code');
//
//                   $scope.editor.on('blur', function(e) {
//                       console.log('change. '+angular.toJson(e));
//                       $scope.codeBinding.$transaction(function(currentData) {
//                           return $scope.editor.getSession().getValue();
//                       });
//                   });
//
//                   $scope.codeBinding.$on('change', function() {
//                      $scope.editor.getSession().setValue($scope.editorBinding.code);
//                   });
//
//               $scope.editorBinding.$on('change', function() {
//                   $scope.editor.setValue($scope.editorBinding.code);
//               });

                if (child.val().isCodeLocked == true) {
                    $scope.codeLocked = true;
                    $scope.editor.setReadOnly(true);
                }
                else {
                    $scope.codeLocked = false;
                    $scope.editor.setReadOnly(false);
                }

                if (child.val().isPrivate) {
                    $scope.isGroupPrivate = true;
                }
                else {
                    $scope.isGroupPrivate = false;
                }

                if (child.val().code != '') {
                    $scope.editor.getSession().setValue(child.val().code);
                }
            }
        });
        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }
    });



    $scope.saveCode = function() {
        var code = $scope.editor.getSession().getValue();
        var currentGroup = $routeParams.groupName;
        var currentGroupRef = $rootScope.getFBRef('groups/'+currentGroup);

        if (!!code) {
            currentGroupRef.$update({
               code: code
            });
            alert('Code Saved!');
        } else {
            alert('There is no Code to Save');
        }

    };

    $scope.lockCode = function() {
        var currentGroup = $routeParams.groupName;
        var currentGroupRef = $rootScope.getFBRef('groups/'+currentGroup);

        currentGroupRef.$update({
           isCodeLocked: true
        });

        $scope.editor.setReadOnly(true);
        $scope.codeLocked = true;

        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }
    };

    $scope.unlockCode = function () {
        var currentGroup = $routeParams.groupName;
        var currentGroupRef = $rootScope.getFBRef('groups/'+currentGroup);

        $scope.saveLoader = true;

        $scope.editor.setReadOnly(false);

        currentGroupRef.$update({
           isCodeLocked: false
        });

        $scope.codeLocked = false;

        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }

        $scope.saveLoader = false;

    };

    $scope.changeGroupVisibility = function () {

        var currentGroup = $routeParams.groupName;
        var currentGroupRef = $rootScope.getFBRef('groups/'+currentGroup);
        var currentUserGroups= $rootScope.getNormalFBRef('users/'+$rootScope.auth.user.uid+'/allowedGroups');

        //Update isPrivate in /Users/CurrentUser/AllowedGroups
        currentUserGroups.once('value', function(data) {
           data.forEach(function(child) {
              console.log(child.val());
              if (child.val().fullName == currentGroup) {
                  if (child.val().isPrivate) {
                      child.ref().update({
                          isPrivate: false
                      });
                  }
                  else {
                      child.ref().update({
                          isPrivate: true
                      });
                  }

              }
           });
        });

        //Update isPrivate in /Groups
        currentGroupRef.$on('loaded', function(data) {
            if (data.isPrivate) {
                currentGroupRef.$update({
                   isPrivate: false
                });
                $scope.isGroupPrivate = false;
            }
            else {
                currentGroupRef.$update({
                   isPrivate: true
                });
                $scope.isGroupPrivate = true;
            }
        });
    };

    $scope.viewNote = function (noteKey) {
        $scope.noteToView = $rootScope.getFBRef('groups/'+$scope.currentGroupFull+'/notes/'+noteKey);

        if (!$scope.$$phase) {  //SAFE APPLY TO ANGULAR
            $scope.$apply();
        }

        $scope.viewModalEditor.getSession().setValue($scope.noteToView.code);

        $scope.viewTitle = $scope.noteToView.title;
        $scope.viewContent = $scope.noteToView.content;
        $scope.isArchived = $scope.noteToView.isArchived;
        $scope.noteKey = noteKey;

        var date = new Date($scope.noteToView.createdAt);
    };

    $scope.editor.on('blur', function() {
       $scope.modalEditor.getSession().setValue($scope.editor.session.getTextRange($scope.editor.getSelectionRange()));
    });

    $scope.toggleViewArchived = function() {
        $scope.viewArchived = !$scope.viewArchived;
    };



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

        if (typeof $scope.newNote != 'undefined' && $scope.newNote.noteTitle && $scope.newNote.noteContent) {

            var title = $scope.newNote.noteTitle;
            var content = $scope.newNote.noteContent;
            var noteCode = $scope.modalEditor.getSession().getValue();
            console.log("NoteCode. "+noteCode);
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
                    var currentDate = new Date();
                    var dateToAdd = currentDate.toUTCString();
                    var currentUserEmail = $rootScope.auth.user.email;

                    //Set Note in /Notes -> [GROUPNAME]_[NOTETITLE]
                    currentNoteRef.$set({
                        content: content,
                        code: noteCode,
                        createdAt: dateToAdd,
                        createdBy: currentUserEmail
                    });
                    var groupNotesRef = $rootScope.getFBRef('groups/'+$scope.currentGroupFull+'/notes');

                    //Add Note to Groups/Notes
                    groupNotesRef.$add({
                        title: title,
                        content: content,
                        code: noteCode,
                        createdAt: dateToAdd,
                        createdBy: currentUserEmail,
                        inGroup: $scope.currentGroupFull,
                        isArchived: false
                    });


                    $scope.newNote.noteTitle = "";
                    $scope.newNote.noteContent = "";
                    $scope.modalEditor.getSession().setValue('');
                    angular.element('#addNoteModal').modal('hide');
                }
                else {
                    $scope.showAlert('alert-danger', 'Note "'+title+'" already exists in this group');
                }
            });
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

app.controller('ViewNoteCtrl', function($scope, $rootScope, $routeParams) {
    $scope.currentGroupFull = $routeParams.groupName;
    $scope.archiveNote = function(isArchived) {
        var currentNoteRef = $rootScope.getFBRef('groups/'+$scope.currentGroupFull+'/notes/'+$scope.noteKey);
        if (isArchived) {
            currentNoteRef.$update({
                isArchived: false
            });
        }
        else {
            currentNoteRef.$update({
                isArchived: true
            });
        }


    };
});


app.controller('InviteFriendsCtrl', function($scope, $rootScope, $routeParams) {

    $scope.users = $rootScope.getFBRef('users');

    $scope.currentUser = $rootScope.auth.user.uid;
    //initListBoxes();

    $scope.addUserToGroup = function (userId, userEmail) {

        var userRef = $rootScope.getFBRef('users/'+userId+'/allowedGroups');
        var userNormalRef = $rootScope.getNormalFBRef('users/'+userId+'/allowedGroups');
        var currentGroupFull = $routeParams.groupName;
        var currentGroup = currentGroupFull.split("_")[0];
        var adminUser = $rootScope.auth.user.uid;
        var groupToAddTo = {};
        var groupsRef = $rootScope.getNormalFBRef('groups');
        var fullName = currentGroup + '_' + adminUser;
        var alreadyHasGroup = false;
        var privateSetting;

        groupsRef.once('value', function(snap) {
            snap.forEach(function(child) {
                if (child.name() == fullName) {
                    groupToAddTo = child;
                    privateSetting = child.val().isPrivate;
                }
            });
            userNormalRef.once('value', function(snap) {
                snap.forEach(function(child) {
                    if (child.val().name == currentGroup) {
                        alreadyHasGroup = true;
                    }
                });

                if (!alreadyHasGroup) {
                    userRef.$add({
                        createdBy: groupToAddTo.val().createdBy,
                        mode: groupToAddTo.val().mode,
                        name: currentGroup,
                        fullName: currentGroupFull,
                        isPrivate: privateSetting
                    });
                    $scope.showAlert('alert-success', 'User '+userEmail+' was added to group '+currentGroup+'.');
                }
                else {
                    $scope.showAlert('alert-danger', 'User '+userEmail+' is already in this group');
                }
            });
        });
    };
});