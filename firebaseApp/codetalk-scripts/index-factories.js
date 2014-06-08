//User Access Factory
app.factory('userFactory', function($http, $cookies, $rootScope) {
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
});
        
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
    var fileUrl = 'https://api.parse.com/1/files/';
    var headers = {
        'X-Parse-Application-Id':'LJMF3VG9jF5VXW92SCMIMtxKBcHc3ClfMN7FE2Mf',
        'X-Parse-REST-API-Key':'VXBG3rPRfwyAPsM8ftKPdyqWTX6T5CSyErYKRVY1',
        'X-Parse-Session-Token':$cookies.sessionToken
    };

    var fileHeaders = {
        'X-Parse-Application-Id':'LJMF3VG9jF5VXW92SCMIMtxKBcHc3ClfMN7FE2Mf',
        'X-Parse-REST-API-Key':'VXBG3rPRfwyAPsM8ftKPdyqWTX6T5CSyErYKRVY1',
        'X-Parse-Session-Token':$cookies.sessionToken,
        'Content-Type':'text/plain'        
    }

    //NEED TO ADD ACL
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

    factory.uploadCode = function (fileContent, fileName) {
        console.log("Upload Code CALL\nFile Content: "+fileContent+"\nFile Name: "+fileName);
        return $http({
            method: 'POST',
            url: fileUrl + fileName + '.txt',
            headers: fileHeaders,
            data: fileContent
        });
    }

    factory.associateCode = function(codeUploadName, codeMode, objClass) {
        var codeData = {};
        codeData = {
            "codeMode":codeMode,
            "codeChanges": {
                "name": codeUploadName,
                "__type": "File"
            },
            "ACL":acl
        };
        console.log("Associate Code CALL\nCodeUploadName: "+codeUploadName+"\nObject Class: "+objClass+"\nCode Mode: "+codeMode+"\nCodeData: "+angular.toJson(codeData));
        return $http({
            method: 'POST',
            url: baseUrl + objClass,
            headers: headers,
            data: codeData
        });
    }

    factory.setRelation = function (objClass, objId, relColumn, relChild, childId) {
        var relationData = {};

        relationData[relColumn] = {
            "__op": "AddRelation",
            "objects": [
                {
                    "__type":"Pointer",
                    "className": relChild,
                    "objectId": childId
                }
            ]
        };
        console.log("Set Relation CALL\nObjectClass: "+objClass+"\nObjectID: "+objId+"\nRelColumn: "+relColumn+"\nRelChild: "+relChild+"\nChildID: "+childId);
        return $http({
            method: 'PUT',
            url: baseUrl + objClass + '/' + objId,
            headers: headers,
            data: relationData
        });
    }
    return factory;
});



