

//Group Item Actions Factory
app.factory('GroupFactory', function($rootScope) {

    var factory = {};

    factory.toggleVisibility = function (group, userId) {
        var currentGroupRef = $rootScope.getFBRef('groups/'+group+'_'+userId);

        currentGroupRef.$on('value', function(data) {
           if(data.snapshot.value.isPrivate) {

           }
           else {

           }

        });


    }

    return factory;

});



