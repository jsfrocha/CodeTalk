app.controller('IndexCtrl', function($rootScope) {
    //Recycle Current User Groups (Delete /AllowedGroups that are no longer in /Groups

});

app.controller('LandingCtrl', function($scope) {

});

app.controller('NavbarCtrl', function($scope, $rootScope, $firebase, $location) {


    console.log("Enter NavbarCtrl, RootScope Auth: "+angular.toJson($rootScope.auth));

    $scope.authLoader = false;

    $scope.submitAuth = function () {
        $scope.authLoader = true;
        $rootScope.auth.$login('password', {
            email: $scope.emailAuth,
            password: $scope.passwordAuth
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
app.controller('GroupsCtrl', function($scope, $rootScope) {

    var aceModesRef = $rootScope.getFBRef('aceModes');
    var currentUserGroupsRef = $rootScope.getFBRef('users/'+$rootScope.auth.user.uid+'/allowedGroups');
    var currentUserId = $rootScope.auth.user.uid;

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

        if (!!$scope.newGroupName) {
            if ($scope.selectedMode != "NONE") {
                if (isNameValid($scope.newGroupName)) { //Happy Path

                    currentUserGroupRef.$add({
                        name: newGroupName,
                        mode: selectedMode,
                        createdBy: currentUserId
                    })
                        .then(function (ref) {
                            var groupRef = $rootScope.getFBRef('groups/' + $scope.newGroupName + '_' + currentUserId);
                            groupRef.$set({
                                mode: selectedMode,
                                isPrivate: true,
                                createdBy: currentUserId
                            });
                        });
                    angular.element('#new-groupname-input').val('');
                }
                else { //Invalid Characters
                    showAlert('alert-danger', "Invalid characters, try: '" + suggestName($scope.newGroupName) + "'");
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

    }//End createGroup()

    //Recycle already Deleted Groups TODO: Untested
    if (!!$rootScope.auth.user) {
        console.log("Recycle - IN");
        var currentUser = $rootScope.auth.user.uid;
        var groupsRef = $rootScope.getNormalFBRef('groups');
        var allowedGroupsRef = $rootScope.getNormalFBRef('users/'+currentUser+'/allowedGroups');
        var groupRemovalRef = $rootScope.getFBRef('users/'+currentUser+'/allowedGroups');


        groupsRef.once('value', function(groupSnap) {
           allowedGroupsRef.once('value', function(allowedSnap) {
               var existingGroups = [];
               var groupsToRemove = [];
               groupSnap.forEach(function(groupChild) {
                    existingGroups.push(groupChild.name());
               });
               allowedSnap.forEach(function(allowedChild) {
                    var groupName = allowedChild.val().name;
                    var fullName = groupName + '_' + currentUser;
                    if (existingGroups.indexOf(fullName) != -1) {
                        groupsToRemove.push(allowedChild.name());
                    }
               });
               if (!!groupsToRemove && groupsToRemove.length > 0) {
                   for (var i = 0; i < groupsToRemove.length; i++) {
                       groupRemovalRef.$remove(groupsToRemove[i]);
                   }
               }
           });
        });
        //TODO: Set $scope.groups again after recycle
        console.log("Recycle - OUT");
    }

});

app.controller('SingleGroupCtrl', function($scope, $rootScope, $routeParams, $firebase) {
    $scope.currentGroup = $routeParams.groupName;
    var currentUserId = $rootScope.auth.user.uid;
    $scope.isUserAdmin = false;

    $scope.editor = ace.edit("code-editor");
    $scope.editor.setTheme("ace/theme/github");

    $scope.modalEditor = ace.edit("modal-code-editor");
    $scope.modalEditor.setTheme("ace/theme/github");
    $scope.modalEditor.setReadOnly(true);


    var groupsRef = $rootScope.getNormalFBRef('groups');
    groupsRef.once('value', function(snap) {
        snap.forEach(function(child) {
            if (child.name() == $scope.currentGroup + '_' + currentUserId) {
                if (child.val().createdBy == currentUserId) $scope.isUserAdmin = true;
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
            });
            var existingNotes = new Array();
            for (var i = 0; i < existingNotesArray.length; i++) {
                if (existingNotesArray[i].split('_')[0] == $scope.currentGroup)
                    existingNotes.push(existingNotesArray[i].split('_')[1]);
            }

            if (existingNotes.indexOf(title) == -1) {

                //Set Note in /Notes -> [GROUPNAME]_[NOTETITLE]
                currentNoteRef.$set({
                    content: content,
                    code: code
                });

                var groupNotesRef = $rootScope.getFBRef('groups/'+$scope.currentGroup + '_' + currentUserId+'/notes');

                //Add Note to Groups/Notes
                groupNotesRef.$add({
                    title: title,
                    content: content,
                    code: code
                });

                $scope.newNote.noteTitle = "";
                $scope.newNote.noteContent = "";
                $scope.modalEditor.getSession().setValue('');
                angular.element('#addNoteModal').modal('hide');
            }
            else {
                $scope.showAlert('alert-danger', 'Note "'+title+'" already exists in this group');
            }

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
            var groupsRef = $rootScope.getFBRef('groups');

            //Delete from /Groups
            groupsRef.$remove(currentGroup + '_' + currentUser);

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