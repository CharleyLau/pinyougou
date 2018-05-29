 //控制层 
app.controller('itemCatController' ,function($scope,$controller,itemCatService,typeTemplateService){
	
	$controller('baseController',{$scope:$scope});//继承
	
    //读取列表数据绑定到表单中  
	$scope.findAll=function(){
		itemCatService.findAll().success(
			function(response){
				$scope.list=response;
			}			
		);
	}    
	
	//分页
	$scope.findPage=function(page,rows){			
		itemCatService.findPage(page,rows).success(
			function(response){
				$scope.list=response.rows;	
				$scope.paginationConf.totalItems=response.total;//更新总记录数
			}			
		);
	}
	
	//查询实体 
	$scope.findOne=function(id){				
		itemCatService.findOne(id).success(
			function(response){
				$scope.entity= response;					
			}
		);				
	}
	
	//保存 
	$scope.save=function(){				
		var serviceObject;//服务层对象  				
		if($scope.entity.id!=null){//如果有ID
			serviceObject=itemCatService.update( $scope.entity ); //修改  
		}else{
			alert("增加");
			serviceObject=itemCatService.add( $scope.entity  );//增加 
		}				
		serviceObject.success(
			function(response){
				if(response.success){
					//重新查询 
		        	$scope.reloadList();//重新加载
				}else{
					alert(response.message);
				}
			}		
		);				
	}
	
	 
	//批量删除 
	$scope.dele=function(){			
		//获取选中的复选框			
		itemCatService.dele( $scope.selectIds ).success(
			function(response){
				alert("删除"+$scope.selectIds);
				if(response.success){
					$scope.reloadList();//刷新列表
					$scope.selectIds=[];
				}						
			}
		);				
	}
	
	$scope.searchEntity={};//定义搜索对象 
	
	//搜索
	$scope.search=function(page,rows){			
		itemCatService.search(page,rows,$scope.searchEntity).success(
			function(response){
				$scope.list=response.rows;	
				$scope.paginationConf.totalItems=response.total;//更新总记录数
			}			
		);
	}

	// 定义初始化上级Id
	$scope.parentId=0;
	// 根据上级Id显示下级列表
	$scope.findByParentId=function (parentId) {

		// 点击下一级的时候,更改上级ID,为了新增时会用到的上级ID
		$scope.parentId = parentId;

		itemCatService.findByParentId(parentId).success(
			function (response) {
				$scope.list=response;
            }
		)
    }

    // 面包屑导航的前端实现
	$scope.grade=1;// 默认为1级开始
	// 设置级别
	$scope.setGrade=function (value) {
		$scope.grade=value;
    }

    // 读取列表,修改面包屑值
	$scope.selectList= function (p_entity) {
		if ($scope.grade==1) {
			// 如果为1级
			$scope.entity_1=null;// 给2级目录赋值
			$scope.entity_2=null;// 给3级目录赋值
		}
		if ($scope.grade==2) {
			// 如果为2级
			$scope.entity_1=p_entity;
			$scope.entity_2=null;
		}
		if ($scope.grade==3) {
			// 如果为3级
			$scope.entity_2=p_entity;
		}

		// 执行完赋值之后,查询此级下级目录
		$scope.findByParentId(p_entity.id);
    }

    // 新增
	$scope.save=function () {
		var serviceObject;// 服务层对象
		if ($scope.entity.id!= null){
			alert("修改..");
			// 如果有id 修改
			serviceObject = itemCatService.update($scope.entity);
		} else{
            alert("添加..");
			$scope.entity.parentId = $scope.parentId; // 赋予上级Id
			serviceObject=itemCatService.add($scope.entity);
		}

		serviceObject.success(
			function (response) {
				if (response.success){
					// 增加成功,刷新列表
					$scope.findByParentId($scope.parentId);
				} else {
					alert(response.message);
				}
            }
		)

    }

    $scope.typeTemplateList={data:[]};// 规格列表
    // 读取模板列表
    $scope.findTypeTemplateList=function () {
        typeTemplateService.findTypeTemplateList().success(
            function (response) {
                $scope.typeTemplateList={data:response};
            }
        );
    }

});	
