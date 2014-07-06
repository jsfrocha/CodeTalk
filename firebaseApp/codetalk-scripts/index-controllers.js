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

//    $scope.testFunction = function () {
//        console.log("Test Function - IN");
//        $scope.groupsRef = $rootScope.getFBRef('groups');
//        $scope.groupsRef.$on('loaded', function () {
//            var existingGroups = $scope.groupsRef.$getIndex();
//            var newGroupName = $scope.newGroupName;
//            existingGroups.forEach(function(key, i) {
//                if (existingGroups[i] == newGroupName) {
//                    showAlert('alert-danger', 'Group name already exists');
//                    return false;
//                }
//            });
//        });
//    }

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
    var editor = ace.edit("code-editor");
    editor.setTheme("ace/theme/github");

    var groupsRef = $rootScope.getNormalFBRef('groups');

    groupsRef.once('value', function(snap) {
        snap.forEach(function(child) {
            if (child.name() == $scope.currentGroup) {
                editor.getSession().setMode("ace/mode/"+child.val().mode);
            }
        });
    });

    $scope.addNote = function () {

    };

    $scope.addSelection = function () {

    };
});