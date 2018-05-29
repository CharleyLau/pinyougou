app.service('loginService',function ($http) {
    this.loginName=function () {
        return $http.get('../login1/name1.do');
    }
});