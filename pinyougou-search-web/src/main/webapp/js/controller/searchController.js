app.controller('searchController',function($scope,$location,searchService){
	// 定义搜索对象的结构
	$scope.searchMap={'keywords':'','category':'','brand':'','spec':{},'price':'','pageNo':1,'pageSize':20,
		'sortField':'','sort':''};

	$scope.resultMap={'total':'','totalPages':'','categoryList':{},'specList':{},'brandList':{},"rows":{}}
	//搜索
	$scope.search=function(){
        $scope.searchMap.pageNo= parseInt($scope.searchMap.pageNo);//转换为数字
		searchService.search($scope.searchMap).success(
			function(response){
				$scope.resultMap=response;	// 搜索返回的结果
				buildPageLabel();//
			}
		);		
	}

	// 添加搜索项
	$scope.addSearchItem = function (key,value) {
		if (key == 'category' || key == 'brand' || key=='price'){// 如果点击的是分类或者品牌
			$scope.searchMap[key]=value;
		}else {
			$scope.searchMap.spec[key]=value;
		}
		$scope.search();
    }

    //撤销搜索项
    $scope.removeSearchItem=function(key){
        if(key=='category' || key=='brand' || key=='price'){//如果用户点击的是分类或品牌
            $scope.searchMap[key]="";
        }else{//用户点击的是规格
            delete $scope.searchMap.spec[key];
        }
        $scope.search();//查询
	}

	// 构建分页标签(totalPages为总页数)
	buildPageLabel=function () {
		$scope.pageLabel=[];// 新增分页栏属性
		var maxPageNo = $scope.resultMap.totalPages;//得到最后页码
		var firstPage=1;// 开始页码
		var lastPage=maxPageNo;// 截止页码
        $scope.firstDot=true;//前面有点
        $scope.lastDot=true;//后边有点
		if ($scope.resultMap.totalPages>5){
			// alert("进入判断");
			// 如果总页数大于5页,显示部分页码
			if ($scope.searchMap.pageNo<=3){
				// 如果当前页码小于等于3
				lastPage=5;// 前五页
                $scope.firstDot=false;//前面没点
			} else if($scope.searchMap.pageNo>=lastPage-2){
				// 如果当前页大于等于最大页码-2
				firstPage=maxPageNo-4;// 手动设置最后5页
                $scope.lastDot=false;//后边没点
			} else {
                // alert("正常显示");
				// 正常显示当前页为中心的5页
				firstPage = $scope.searchMap.pageNo-2;
				lastPage = $scope.searchMap.pageNo+2;
			}
		}else {
            $scope.firstDot=false;//前面无点
            $scope.lastDot=false;//后边无点

        }

		// 循环产生页码标签
		for(var i = firstPage;i<lastPage;i++){
			$scope.pageLabel.push(i);
		}

    }

    //分页查询
    $scope.queryByPage=function(pageNo){
        if(pageNo<1 || pageNo>$scope.resultMap.totalPages){
            return ;
        }
        $scope.searchMap.pageNo=pageNo;
        $scope.search();//查询
    }

    //判断当前页为第一页
    $scope.isTopPage=function(){
        if($scope.searchMap.pageNo==1){
            return true;
        }else{
            return false;
        }
    }

    //判断当前页是否未最后一页
    $scope.isEndPage=function(){
        if($scope.searchMap.pageNo==$scope.resultMap.totalPages){
            return true;
        }else{
            return false;
        }
    }

    // 设置排序规则
	$scope.sortSearch=function (sortField,sort) {
		$scope.searchMap.sortField=sortField;
		$scope.searchMap.sort=sort;
		$scope.search();
    }

    // 判断关键字是不是品牌
	$scope.keywordsIsBrand=function () {
		for (var i=0;i<$scope.resultMap.brandList.length;i++){
			if ($scope.searchMap.keywords.indexOf($scope.resultMap.brandList[i].text)>=0) {
				// 如果包含
				return true;
			}else {
				return false;
			}
		}
		
    }

    // 加载查询字符串
	$scope.loadkeywords=function () {
		$scope.searchMap.keywords=$location.search()['keywords'];
		$scope.search();
    }



    $scope.indexSearch=function(){
        var keywords = $location.search()['keywords']
		if(keywords!=null)
		{
			$scope.searchMap.keywords=keywords;
			$scope.search();
		}
	}

});